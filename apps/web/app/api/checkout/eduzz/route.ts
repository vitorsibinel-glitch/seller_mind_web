import { withDB } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PlanModel } from "@workspace/mongodb/models/plan";
import { BillingAccountModel } from "@workspace/mongodb/models/billing-account";
import { SubscriptionModel, SubscriptionStatus } from "@workspace/mongodb/models/subscription";

export async function GET(req: NextRequest) {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const planSlug = searchParams.get("planSlug");
    const billingCycle = searchParams.get("billingCycle") as "monthly" | "annual";

    if (!planSlug || !billingCycle || !["monthly", "annual"].includes(billingCycle)) {
      return NextResponse.json(
        { message: "planSlug e billingCycle (monthly|annual) são obrigatórios" },
        { status: 400 },
      );
    }

    const plan = await PlanModel.findOne({ slug: planSlug, isActive: true });
    if (!plan) {
      return NextResponse.json({ message: "Plano não encontrado" }, { status: 404 });
    }

    const eduzzProductId = plan.eduzzProductId?.[billingCycle];
    if (!eduzzProductId) {
      return NextResponse.json(
        { message: "Produto Eduzz não configurado para este plano/ciclo" },
        { status: 400 },
      );
    }

    const billingAccount = await BillingAccountModel.findOne({ userId });
    if (!billingAccount) {
      return NextResponse.json({ message: "Conta de billing não encontrada" }, { status: 404 });
    }

    const subscription = await SubscriptionModel.findOne({
      billingAccountId: billingAccount._id,
      status: { $in: [SubscriptionStatus.TRIALING, SubscriptionStatus.CANCELED, SubscriptionStatus.EXPIRED] },
    });

    if (!subscription) {
      return NextResponse.json({ message: "Assinatura não encontrada" }, { status: 404 });
    }

    // Salvar o plano e ciclo escolhido na subscription para o webhook saber
    subscription.planId = plan._id as any;
    subscription.billingCycle = billingCycle as any;
    await subscription.save();

    const checkoutUrl = new URL(`https://sun.eduzz.com/checkout/${eduzzProductId}`);
    checkoutUrl.searchParams.set("email", billingAccount.email);
    checkoutUrl.searchParams.set("name", billingAccount.name);
    checkoutUrl.searchParams.set("utm_source", "omniseller");
    checkoutUrl.searchParams.set("tracker", `${subscription._id}`);

    return NextResponse.json({ checkoutUrl: checkoutUrl.toString() });
  });
}
