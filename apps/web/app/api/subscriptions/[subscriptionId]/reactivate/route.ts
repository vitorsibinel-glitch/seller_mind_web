import { withDB } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { BillingAccountModel } from "@workspace/mongodb/models/billing-account";
import { PlanModel } from "@workspace/mongodb/models/plan";
import {
  SubscriptionModel,
  SubscriptionStatus,
  BillingCycle,
} from "@workspace/mongodb/models/subscription";
import { createAsaasGateway } from "@workspace/billing";
import { env } from "@/env";

const REACTIVATABLE_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.CANCELED,
  SubscriptionStatus.EXPIRED,
];

const ASAAS_CYCLE = { monthly: "MONTHLY", annual: "YEARLY" } as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> },
) {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const { subscriptionId } = await params;

    const billingAccount = await BillingAccountModel.findOne({ userId });
    if (!billingAccount) {
      return NextResponse.json(
        { message: "Conta de billing não encontrada" },
        { status: 404 },
      );
    }

    const subscription = await SubscriptionModel.findOne({
      _id: subscriptionId,
      billingAccountId: billingAccount._id,
    });

    if (!subscription) {
      return NextResponse.json(
        { message: "Assinatura não encontrada" },
        { status: 404 },
      );
    }

    if (!REACTIVATABLE_STATUSES.includes(subscription.status)) {
      return NextResponse.json(
        { message: "Esta assinatura não pode ser reativada" },
        { status: 400 },
      );
    }

    // Sem plano ou ciclo salvos — redireciona para seleção
    if (!subscription.planId || !subscription.billingCycle) {
      return NextResponse.json({ redirectTo: "/plans" }, { status: 200 });
    }

    // Eduzz (clientes legados) — redireciona para nova seleção de plano
    if (!billingAccount.gateway || billingAccount.gateway === "eduzz") {
      return NextResponse.json({ redirectTo: "/plans" }, { status: 200 });
    }

    // Asaas — cria nova assinatura no gateway
    const plan = await PlanModel.findById(subscription.planId);
    if (!plan) {
      return NextResponse.json(
        { message: "Plano não encontrado" },
        { status: 404 },
      );
    }

    const billingCycle = subscription.billingCycle as BillingCycle;
    const price = plan.prices[billingCycle];
    if (!price || price <= 0) {
      return NextResponse.json(
        { message: "Preço não configurado para este ciclo" },
        { status: 400 },
      );
    }

    const gateway = createAsaasGateway(env.ASAAS_API_KEY);

    let asaasCustomerId = billingAccount.asaasCustomerId;
    if (!asaasCustomerId) {
      const customer = await gateway.createCustomer({
        name: billingAccount.name,
        email: billingAccount.email,
        cpfCnpj: billingAccount.document || undefined,
        phone: billingAccount.phone || undefined,
      });
      asaasCustomerId = customer.gatewayCustomerId;
      billingAccount.asaasCustomerId = asaasCustomerId;
      await billingAccount.save();
    }

    const result = await gateway.createSubscription({
      gatewayCustomerId: asaasCustomerId,
      value: price,
      billingType: "CREDIT_CARD",
      cycle: ASAAS_CYCLE[billingCycle],
      description: `Sellermind — ${plan.name} (reativação)`,
    });

    subscription.asaasSubscriptionId = result.gatewaySubscriptionId;
    await subscription.save();

    return NextResponse.json({ checkoutUrl: result.checkoutUrl });
  });
}
