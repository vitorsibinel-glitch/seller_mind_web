import { useTry } from "@/hooks/use-try";
import { withDB } from "@/lib/mongoose";
import { createInvoiceSchema } from "@/schemas/invoiceSchema";
import { InvoiceModel } from "@workspace/mongodb/models/invoice";
import { StoreModel } from "@workspace/mongodb/models/store";
import { fromZonedTime } from "date-fns-tz";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ invoiceId: string }> },
) {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");
    const { invoiceId } = await params;
    const url = new URL(req.url);
    const storeId = url.searchParams.get("storeId");
    const body = await req.json();

    if (!storeId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const store = await StoreModel.findOne({
      _id: storeId,
      userId,
      active: true,
    }).lean();

    if (!store) {
      return NextResponse.json(
        { error: "Loja não encontrada ou usuário não autorizado." },
        { status: 404 },
      );
    }

    const existingInvoice = await InvoiceModel.findOne({
      _id: invoiceId,
      storeId,
      createdByUserId: userId,
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { error: "Nota fiscal não encontrada." },
        { status: 404 },
      );
    }

    const parsed = createInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.errors },
        { status: 400 },
      );
    }

    const {
      number,
      type,
      emittedAt,
      totalAmount,
      cnpjCpf,
      partnerName,
      note,
      xmlRaw,
    } = parsed.data;

    const duplicateInvoice = await InvoiceModel.findOne({
      _id: { $ne: invoiceId },
      number,
      cnpjCpf,
      type,
      storeId,
    });

    if (duplicateInvoice) {
      return NextResponse.json(
        {
          error:
            "Já existe outra nota com este número desta mesma empresa/cliente.",
        },
        { status: 400 },
      );
    }

    const [updatedInvoice, error] = await useTry(async () => {
      const emittedAtDate = fromZonedTime(
        `${emittedAt}T00:00:00`,
        "America/Sao_Paulo",
      );

      if (isNaN(emittedAtDate.getTime())) {
        throw new Error(`Data inválida: ${emittedAt}`);
      }

      return await InvoiceModel.findByIdAndUpdate(
        invoiceId,
        {
          number,
          type,
          emittedAt: emittedAtDate,
          totalAmount,
          cnpjCpf,
          partnerName,
          note,
          xmlRaw,
        },
        { new: true },
      );
    });

    if (error || !updatedInvoice) {
      return NextResponse.json(
        { error: "Erro ao atualizar a nota fiscal." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Nota fiscal atualizada com sucesso.",
      invoice: updatedInvoice,
    });
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ invoiceId: string }> },
) {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");
    const { invoiceId } = await params;
    const url = new URL(req.url);
    const storeId = url.searchParams.get("storeId");

    if (!storeId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const store = await StoreModel.findOne({
      _id: storeId,
      userId,
      active: true,
    }).lean();

    if (!store) {
      return NextResponse.json(
        { error: "Loja não encontrada ou usuário não autorizado." },
        { status: 404 },
      );
    }

    const invoice = await InvoiceModel.findOne({
      _id: invoiceId,
      storeId,
      createdByUserId: userId,
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Nota fiscal não encontrada." },
        { status: 404 },
      );
    }

    if (invoice.status === "booked") {
      return NextResponse.json(
        { error: "Não é possível excluir uma nota fiscal já contabilizada." },
        { status: 400 },
      );
    }

    const [deletedInvoice, error] = await useTry(async () => {
      return await InvoiceModel.findByIdAndDelete(invoiceId);
    });

    if (error || !deletedInvoice) {
      return NextResponse.json(
        { error: "Erro ao excluir a nota fiscal." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Nota fiscal excluída com sucesso.",
    });
  });
}
