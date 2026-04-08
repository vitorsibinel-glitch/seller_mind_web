import { withDB } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PlanModel } from "@workspace/mongodb/models/plan";
import { BillingAccountModel } from "@workspace/mongodb/models/billing-account";
import {
  SubscriptionModel,
  SubscriptionStatus,
} from "@workspace/mongodb/models/subscription";
import { createAsaasGateway } from "@workspace/billing";
import { env } from "@/env";
import { z } from "zod";

const bodySchema = z.object({
  planSlug: z.string().min(1),
  billingCycle: z.enum(["monthly", "annual"]),
  paymentMethod: z.enum(["credit_card", "pix"]).default("credit_card"),
});

const ASAAS_CYCLE = { monthly: "MONTHLY", annual: "YEARLY" } as const;
const ASAAS_BILLING_TYPE = {
  credit_card: "CREDIT_CARD",
  pix: "PIX",
} as const;

export async function POST(req: NextRequest) {
  return withDB(async () => {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dados inválidos", errors: parsed.error.format() },
        { status: 400 },
      );
    }

    const { planSlug, billingCycle, paymentMethod } = parsed.data;

    const plan = await PlanModel.findOne({ slug: planSlug, isActive: true });
    if (!plan) {
      return NextResponse.json(
        { message: "Plano não encontrado" },
        { status: 404 },
      );
    }

    // Valor vem do Mongo — sem produto cadastrado no Asaas
    const price = plan.prices[billingCycle];
    if (!price || price <= 0) {
      return NextResponse.json(
        { message: "Preço não configurado para este ciclo" },
        { status: 400 },
      );
    }

    const billingAccount = await BillingAccountModel.findOne({ userId });
    if (!billingAccount) {
      return NextResponse.json(
        { message: "Conta de billing não encontrada" },
        { status: 404 },
      );
    }

    if (billingAccount.gateway !== "asaas") {
      return NextResponse.json(
        { message: "Esta conta utiliza outro gateway de pagamento" },
        { status: 400 },
      );
    }

    const subscription = await SubscriptionModel.findOne({
      billingAccountId: billingAccount._id,
      status: {
        $in: [
          SubscriptionStatus.TRIALING,
          SubscriptionStatus.CANCELED,
          SubscriptionStatus.EXPIRED,
        ],
      },
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return NextResponse.json(
        { message: "Nenhuma assinatura elegível encontrada" },
        { status: 404 },
      );
    }

    const gateway = createAsaasGateway(env.ASAAS_API_KEY);

    // Cria customer no Asaas se ainda não existir — reutiliza se já tiver
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

    // Cria assinatura no Asaas com valor direto do Mongo
    const result = await gateway.createSubscription({
      gatewayCustomerId: asaasCustomerId,
      value: price,
      billingType: ASAAS_BILLING_TYPE[paymentMethod],
      cycle: ASAAS_CYCLE[billingCycle],
      description: `Sellermind — ${plan.name} (${billingCycle === "monthly" ? "Mensal" : "Anual"})`,
    });

    // Persiste seleção e ID Asaas na Subscription do Mongo.
    // status permanece TRIALING — ativação ocorre apenas no webhook.
    subscription.planId = plan._id as any;
    subscription.billingCycle = billingCycle as any;
    subscription.gateway = "asaas";
    subscription.asaasSubscriptionId = result.gatewaySubscriptionId;
    await subscription.save();

    return NextResponse.json({ checkoutUrl: result.checkoutUrl });
  });
}
