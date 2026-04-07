import { withDB } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateStoreFromRequest } from "@/lib/validate-store-from-request";
import { HttpError } from "@/app/core/http-error";
import { BillingAccountModel } from "@workspace/mongodb/models/billing-account";
import { SubscriptionModel } from "@workspace/mongodb/models/subscription";
import { PlanModel } from "@workspace/mongodb/models/plan";
import { OrderModel } from "@workspace/mongodb/models/order";
import { fromZonedTime } from "date-fns-tz";

const TIMEZONE = "America/Sao_Paulo";

export async function GET(req: NextRequest) {
  return withDB(async () => {
    // validateStoreFromRequest verifica que storeId pertence ao userId autenticado
    let store: { _id: unknown };
    let userId: string;
    try {
      ({ store, userId } = await validateStoreFromRequest(req));
    } catch (err) {
      if (err instanceof HttpError) {
        return NextResponse.json({ message: err.message }, { status: err.status });
      }
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const billingAccount = await BillingAccountModel.findOne({ userId });
    if (!billingAccount) {
      return NextResponse.json(
        { message: "Conta de billing não encontrada" },
        { status: 404 },
      );
    }

    const subscription = await SubscriptionModel.findOne({
      billingAccountId: billingAccount._id,
    })
      .sort({ createdAt: -1 })
      .populate("planId");

    if (!subscription?.planId) {
      return NextResponse.json(
        { message: "Nenhum plano ativo encontrado" },
        { status: 404 },
      );
    }

    const currentPlan = subscription.planId as any;

    // Início do mês calendário no fuso America/Sao_Paulo, convertido para UTC
    // para bater com os timestamps armazenados no Mongo.
    // Padrão do projeto: fromZonedTime de date-fns-tz.
    const now = new Date();
    const year = now.toLocaleDateString("en-CA", {
      timeZone: TIMEZONE,
      year: "numeric",
    });
    const month = now.toLocaleDateString("en-CA", {
      timeZone: TIMEZONE,
      month: "2-digit",
    });
    const startOfMonthUtc = fromZonedTime(`${year}-${month}-01 00:00:00`, TIMEZONE);

    const [agg] = await OrderModel.aggregate([
      {
        $match: {
          storeId: store._id,
          orderDate: { $gte: startOfMonthUtc },
          orderStatus: { $nin: ["Canceled", "Unfulfillable"] },
        },
      },
      { $unwind: "$items" },
      { $group: { _id: null, total: { $sum: "$items.quantity" } } },
    ]);

    const currentUnits: number = agg?.total ?? 0;
    const planLimit: number =
      currentPlan.limits?.maxOrders ?? currentPlan.limits?.maxUnits ?? 0;

    const utilizationPct =
      planLimit > 0 ? Math.round((currentUnits / planLimit) * 100) : 0;

    // Próximo plano acima (sem downgrade): sortOrder maior, limite suficiente
    const recommendedPlan = await PlanModel.findOne({
      isActive: true,
      sortOrder: { $gt: currentPlan.sortOrder ?? 0 },
      $or: [
        { "limits.maxOrders": { $gt: currentUnits } },
        { "limits.maxUnits": { $gt: currentUnits } },
      ],
    }).sort({ sortOrder: 1 });

    return NextResponse.json({
      currentUnits,
      planLimit,
      utilizationPct,
      currentPlan: {
        _id: currentPlan._id,
        name: currentPlan.name,
        slug: currentPlan.slug,
      },
      recommendedPlan: recommendedPlan ?? null,
    });
  });
}
