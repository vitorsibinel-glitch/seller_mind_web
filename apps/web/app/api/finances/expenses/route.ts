import { NextResponse } from "next/server";
import { fromZonedTime } from "date-fns-tz";
import { createExpenseSchema } from "@/schemas/expenseSchema";
import { withDB } from "@/lib/mongoose";
import { useTry } from "@/hooks/use-try";
import { ExpenseModel } from "@workspace/mongodb/models/expense";
import { validateStoreFromRequest } from "@/lib/validate-store-from-request";
import { DREPeriodEnum } from "@/utils/get-dre-period";
import { resolveExpensePeriodToUtc } from "@/utils/resolve-expense-period-to-utc";
import type { ExpensePeriodEnum } from "@/utils/get-expense-period";
import { createRecurringExpensesData } from "@/utils/generate-recurring-due-dates";

export async function GET(req: Request) {
  return withDB(async () => {
    const url = new URL(req.url);
    const period = (url.searchParams.get("period") ||
      DREPeriodEnum.CURRENT_MONTH) as ExpensePeriodEnum;
    const startDate = url.searchParams.get("startDate") || null;
    const endDate = url.searchParams.get("endDate") || null;

    const { store } = await validateStoreFromRequest(req);

    const { fromDateUtc, toDateUtc } = resolveExpensePeriodToUtc({
      period,
      startDate,
      endDate,
    });

    const expenses = await ExpenseModel.find({
      storeId: store._id,
      dueDate: { $gte: fromDateUtc, $lt: toDateUtc },
    }).lean();

    const stats = {
      totalExpenses: expenses.length,
      totalCurrentMonth: expenses.reduce((sum, e) => sum + e.amount, 0),
      totalFuture: "",
    };

    return NextResponse.json({ expenses, stats });
  });
}

export async function POST(req: Request) {
  return withDB(async () => {
    const { store, userId } = await validateStoreFromRequest(req);

    const body = await req.json();

    const parsed = createExpenseSchema.safeParse(body);

    if (!parsed.success) {
      console.log("Erro de validação:", parsed.error.errors);
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.errors },
        { status: 400 },
      );
    }

    const {
      description,
      category,
      amount,
      dueDate,
      isRecurring,
      recurrence,
      documentRef,
      notes,
      tags,
    } = parsed.data;

    const [result, error] = await useTry(async () => {
      const dueDateParsed = fromZonedTime(
        `${dueDate}T00:00:00`,
        "America/Sao_Paulo",
      );

      if (isNaN(dueDateParsed.getTime())) {
        throw new Error(`Data inválida: ${dueDate}`);
      }

      const expenseData: any = {
        description,
        category,
        amount,
        dueDate: dueDateParsed,
        isRecurring,
        documentRef,
        notes,
        tags,
        createdByUserId: userId,
        storeId: store._id,
      };

      if (isRecurring && recurrence) {
        expenseData.recurrence = {
          type: recurrence.type,
          interval: recurrence.interval,
          dueDay: recurrence.dueDay,
          endDate: recurrence.endDate
            ? fromZonedTime(
                `${recurrence.endDate}T00:00:00`,
                "America/Sao_Paulo",
              )
            : undefined,
        };
      }

      const originalExpense = await ExpenseModel.create(expenseData);

      if (isRecurring && recurrence && recurrence.type !== "none") {
        const recurringExpensesData = createRecurringExpensesData(
          {
            description,
            category,
            amount,
            dueDate: dueDateParsed,
            recurrence: expenseData.recurrence,
            documentRef,
            notes,
            tags,
            storeId: store._id,
            createdByUserId: userId,
          },
          originalExpense._id,
        );

        if (recurringExpensesData.length > 0) {
          await ExpenseModel.insertMany(recurringExpensesData);
        }

        return {
          originalExpense,
          recurringCount: recurringExpensesData.length,
        };
      }

      return {
        originalExpense,
        recurringCount: 0,
      };
    });

    if (error || !result) {
      console.error("Erro ao criar despesa:", error);
      return NextResponse.json(
        { message: "Erro ao criar a despesa." },
        { status: 500 },
      );
    }

    const message =
      result.recurringCount > 0
        ? `Despesa criada com sucesso! ${result.recurringCount} lançamentos futuros foram gerados.`
        : "Despesa criada com sucesso.";

    return NextResponse.json({
      message,
      expenseId: result.originalExpense._id,
      recurringCount: result.recurringCount,
    });
  });
}
