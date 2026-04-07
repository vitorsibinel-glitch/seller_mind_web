import { useTry } from "@/hooks/use-try";
import { withDB } from "@/lib/mongoose";
<<<<<<< HEAD
=======
import { requireSubscription } from "@/lib/require-subscription";
>>>>>>> origin/feat/fases-1-4
import { validateStoreFromRequest } from "@/lib/validate-store-from-request";
import { createInvoiceSchema } from "@/schemas/invoiceSchema";
import { getPeriod, PeriodEnum } from "@/utils/get-period";
import { InvoiceModel } from "@workspace/mongodb/models/invoice";
import { StoreModel } from "@workspace/mongodb/models/store";
import { addDays } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { NextResponse } from "next/server";

export async function GET(req: Request): Promise<NextResponse> {
  return withDB(async () => {
    const url = new URL(req.url);
    const period = url.searchParams.get("period") || PeriodEnum.TODAY;
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    const { store, userId } = await validateStoreFromRequest(req);
<<<<<<< HEAD
=======
    const denied = await requireSubscription(userId);
    if (denied) return denied;
>>>>>>> origin/feat/fases-1-4

    let fromDateUtc: Date | null = null;
    let toDateUtc: Date | null = null;

    if (period === PeriodEnum.CUSTOM && startDate && endDate) {
      fromDateUtc = fromZonedTime(`${startDate}T00:00:00`, "America/Sao_Paulo");
      toDateUtc = fromZonedTime(`${endDate}T00:00:00`, "America/Sao_Paulo");
      toDateUtc = addDays(toDateUtc, 1);
    } else {
      const periodResult = getPeriod(period);
      if (!periodResult?.fromDateUtc || !periodResult.toDateUtc) {
        return NextResponse.json(
          { error: "Periodo inválido" },
          { status: 400 },
        );
      }
      fromDateUtc = new Date(periodResult.fromDateUtc);
      toDateUtc = new Date(periodResult.toDateUtc);
    }

    if (!fromDateUtc || !toDateUtc) {
      return NextResponse.json({ error: "Data inválida" }, { status: 400 });
    }

    const baseQuery: any = {
      storeId: store._id,
      createdByUserId: userId,
      emittedAt: { $gte: fromDateUtc, $lt: toDateUtc },
    };

    const invoices = await InvoiceModel.find(baseQuery)
      .sort({ emittedAt: -1 })
      .lean();

    const exitTotalAmount = invoices
      .filter((inv) => inv.type === "exit")
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    const entryTotalAmount = invoices
      .filter((inv) => inv.type === "entry")
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    const stats = {
      totalInvoices: invoices.length,
      exitTotalAmount,
      entryTotalAmount,
    };

    return NextResponse.json({
      invoices,
      stats,
    });
  });
}

export async function POST(req: Request) {
  return withDB(async () => {
    const url = new URL(req.url);
    const storeId = url.searchParams.get("storeId");
    const body = await req.json();
    const userId = req.headers.get("x-user-id");

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

    const parsed = createInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      console.log("Erro de validação:", parsed.error.errors);
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

    const existingInvoice = await InvoiceModel.findOne({
      number,
      cnpjCpf,
      type,
      storeId,
    });

    if (existingInvoice) {
      return NextResponse.json(
        {
          message:
            "Já existe uma nota com este número desta mesma empresa/cliente.",
        },
        { status: 400 },
      );
    }

    const [newInvoice, error] = await useTry(async () => {
      const emittedAtDate = fromZonedTime(
        `${emittedAt}T00:00:00`,
        "America/Sao_Paulo",
      );

      if (isNaN(emittedAtDate.getTime())) {
        throw new Error(`Data inválida: ${emittedAt}`);
      }

      return await InvoiceModel.create({
        number,
        type,
        emittedAt: emittedAtDate,
        totalAmount,
        cnpjCpf,
        partnerName,
        note,
        xmlRaw,
        status: "pending",
        createdByUserId: userId,
        storeId: store._id,
      });
    });

    if (error || !newInvoice) {
      return NextResponse.json(
        { message: "Erro ao criar a nota fiscal." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Nota fiscal criada com sucesso.",
      invoiceId: newInvoice._id,
    });
  });
}
