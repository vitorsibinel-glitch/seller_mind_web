import { NextResponse } from "next/server";
import { fromZonedTime } from "date-fns-tz";
import { withDB } from "@/lib/mongoose";
import { useTry } from "@/hooks/use-try";
import { ExpenseModel } from "@workspace/mongodb/models/expense";
import { validateStoreFromRequest } from "@/lib/validate-store-from-request";
import { updateExpenseSchema } from "@/schemas/expenseSchema";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ expenseId: string }> },
) {
  return withDB(async () => {
    const { store } = await validateStoreFromRequest(req);
    const { expenseId } = await params;

    const body = await req.json();
    const parsed = updateExpenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.errors },
        { status: 400 },
      );
    }

    const { updateFuture, ...updateData } = body;

    const [result, error] = await useTry(async () => {
      const expense = await ExpenseModel.findOne({
        _id: expenseId,
        storeId: store._id,
      });

      if (!expense) {
        throw new Error("Despesa não encontrada");
      }

      const expenseUpdate: any = {};

      if (updateData.description !== undefined) {
        expenseUpdate.description = updateData.description;
      }
      if (updateData.category !== undefined) {
        expenseUpdate.category = updateData.category;
      }
      if (updateData.amount !== undefined) {
        expenseUpdate.amount = updateData.amount;
      }
      let newDueDate: Date | undefined = undefined;
      if (updateData.dueDate !== undefined) {
        newDueDate = fromZonedTime(
          `${updateData.dueDate}T00:00:00`,
          "America/Sao_Paulo",
        );
        expenseUpdate.dueDate = newDueDate;
      }
      if (updateData.documentRef !== undefined) {
        expenseUpdate.documentRef = updateData.documentRef;
      }
      if (updateData.notes !== undefined) {
        expenseUpdate.notes = updateData.notes;
      }
      if (updateData.isRecurring !== undefined) {
        expenseUpdate.isRecurring = updateData.isRecurring;
      }

      if (updateData.recurrence) {
        expenseUpdate.recurrence = {
          type: updateData.recurrence.type,
          interval: updateData.recurrence.interval,
          dueDay: updateData.recurrence.dueDay,
          endDate: updateData.recurrence.endDate
            ? fromZonedTime(
                `${updateData.recurrence.endDate}T00:00:00`,
                "America/Sao_Paulo",
              )
            : undefined,
        };
      }

      const isRecurring = expense.isRecurring;
      if (updateFuture && isRecurring) {
        const rootId = expense.recurringId ?? expense._id;
        const query = {
          $or: [{ _id: rootId }, { recurringId: rootId }],
          storeId: store._id,
          dueDate: { $gte: expense.dueDate },
        };

        const docs = await ExpenseModel.find(query).lean();

        const baseUpdate = { ...expenseUpdate };
        delete baseUpdate.dueDate;

        const originalDateMs = expense.dueDate.getTime();
        const newDateMs = newDueDate ? newDueDate.getTime() : undefined;
        const deltaMs =
          newDateMs !== undefined ? newDateMs - originalDateMs : 0;

        for (const doc of docs) {
          const perUpdate: any = { ...baseUpdate };
          if (newDateMs !== undefined) {
            perUpdate.dueDate = new Date(doc.dueDate.getTime() + deltaMs);
          }
          await ExpenseModel.updateOne({ _id: doc._id }, { $set: perUpdate });
        }

        return {
          updatedCount: docs.length,
        };
      }

      await ExpenseModel.updateOne({ _id: expenseId }, { $set: expenseUpdate });

      return { updatedCount: 1 };
    });

    if (error || !result) {
      console.error("Erro ao atualizar despesa:", error);
      return NextResponse.json(
        { message: "Erro ao atualizar despesa." },
        { status: 500 },
      );
    }

    const message =
      result.updatedCount > 1
        ? `Despesa atualizada! ${result.updatedCount - 1} lançamentos futuros também foram atualizados.`
        : "Despesa atualizada com sucesso.";

    return NextResponse.json({
      message,
      updatedCount: result.updatedCount,
    });
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ expenseId: string }> },
) {
  return withDB(async () => {
    const { store } = await validateStoreFromRequest(req);
    const { expenseId } = await params;

    const url = new URL(req.url);
    const deleteFuture = url.searchParams.get("deleteFuture") === "true";

    const expense = await ExpenseModel.findOne({
      _id: expenseId,
      storeId: store._id,
    });

    if (!expense) {
      return NextResponse.json(
        { message: "Despesa não encontrada" },
        { status: 404 },
      );
    }

    if (deleteFuture && expense.isRecurring) {
      const rootId = expense.recurringId ?? expense._id;
      const query = {
        $or: [{ _id: rootId }, { recurringId: rootId }],
        storeId: store._id,
        dueDate: { $gte: expense.dueDate },
      };

      const result = await ExpenseModel.deleteMany(query);

      return NextResponse.json({
        message: `Despesa e ${result.deletedCount - 1} lançamentos futuros excluídos com sucesso`,
        deletedCount: result.deletedCount,
      });
    }

    await ExpenseModel.deleteOne({ _id: expenseId });

    return NextResponse.json({
      message: "Despesa excluída com sucesso",
      deletedCount: 1,
    });
  });
}
