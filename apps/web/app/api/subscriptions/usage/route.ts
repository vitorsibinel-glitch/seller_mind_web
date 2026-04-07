import { withDB } from "@/lib/mongoose";
import { BillingAccountModel } from "@workspace/mongodb/models/billing-account";
import { SubscriptionModel } from "@workspace/mongodb/models/subscription";
import { StoreModel } from "@workspace/mongodb/models/store";
import { OrderModel } from "@workspace/mongodb/models/order";
import { fromZonedTime } from "date-fns-tz";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TIMEZONE = "America/Sao_Paulo";

export async function GET(req: NextRequest): Promise<NextResponse> {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const billingAccount = await BillingAccountModel.findOne({ userId }).lean();
    if (!billingAccount) {
      return NextResponse.json({ message: "Conta não encontrada" }, { status: 404 });
    }

    const subscription = await SubscriptionModel.findOne({
      billingAccountId: billingAccount._id,
    })
      .sort({ createdAt: -1 })
      .populate("planId", "name limits")
      .lean();

    if (!subscription) {
      return NextResponse.json({ message: "Assinatura não encontrada" }, { status: 404 });
    }

    const plan = subscription.planId as any;
    const limits = plan?.limits ?? {};

    // Mês calendário no fuso America/Sao_Paulo — mesmo critério do upgrade-recommendation
    const now = new Date();
    const year = now.toLocaleDateString("en-CA", { timeZone: TIMEZONE, year: "numeric" });
    const month = now.toLocaleDateString("en-CA", { timeZone: TIMEZONE, month: "2-digit" });
    const periodStart = fromZonedTime(`${year}-${month}-01 00:00:00`, TIMEZONE);

    // Lojas ativas do usuário
    const stores = await StoreModel.find({ userId, active: true })
      .select("_id")
      .lean();
    const storeIds = stores.map((s) => s._id);
    const storesCount = storeIds.length;

    // Pedidos no mês calendário (todas as lojas do usuário)
    const ordersThisPeriod =
      storeIds.length > 0
        ? await OrderModel.countDocuments({
            storeId: { $in: storeIds },
            orderDate: { $gte: periodStart },
          })
        : 0;

    return NextResponse.json({
      usage: {
        ordersThisPeriod,
        storesCount,
        usersCount: 1,
      },
      limits: {
        maxOrders: limits.maxOrders ?? null,
        stores: limits.stores ?? null,
        users: limits.users ?? null,
        gamificationBonus: limits.gamificationBonus ?? null,
      },
      periodStart,
    });
  });
}
