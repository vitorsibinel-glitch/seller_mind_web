import { useTry } from "@/hooks/use-try";
import { withDB } from "@/lib/mongoose";
import { InvoiceModel } from "@workspace/mongodb/models/invoice";
import { StoreModel } from "@workspace/mongodb/models/store";
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

    const { status } = body;

    if (!status || !["pending", "booked", "canceled"].includes(status)) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }

    if (invoice.status === "booked" && status !== "booked") {
      return NextResponse.json(
        { error: "Não é possível alterar o status de uma nota contabilizada." },
        { status: 400 },
      );
    }

    const [updatedInvoice, error] = await useTry(async () => {
      return await InvoiceModel.findByIdAndUpdate(
        invoiceId,
        { status },
        { new: true },
      );
    });

    if (error || !updatedInvoice) {
      return NextResponse.json(
        { error: "Erro ao atualizar status da nota fiscal." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Status atualizado com sucesso.",
      invoice: updatedInvoice,
    });
  });
}
