import { withDB } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  SubscriptionModel,
  SubscriptionStatus,
} from "@workspace/mongodb/models/subscription";
import {
  activateSubscription,
  markPastDue,
  cancelSubscription,
  refundSubscription,
} from "@workspace/billing";
import { env } from "@/env";

/**
 * Payload simplificado do Asaas.
 * O Asaas envia um envelope { event, payment } para a maioria dos eventos.
 */
interface AsaasWebhookPayload {
  event: string;
  payment?: {
    id: string;
    subscription?: string; // ID da subscription Asaas
    value: number;
    status: string;
    billingType: string;
  };
  subscription?: {
    id: string;
    status: string;
  };
}

function validateToken(req: NextRequest): boolean {
  const token = req.headers.get("asaas-access-token");
  return !!token && token === env.ASAAS_WEBHOOK_TOKEN;
}

export async function POST(req: NextRequest) {
  if (!validateToken(req)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let payload: AsaasWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  return withDB(async () => {
    const { event, payment, subscription: subPayload } = payload;

    const asaasSubscriptionId =
      payment?.subscription ?? subPayload?.id ?? null;

    if (!asaasSubscriptionId) {
      return NextResponse.json(
        { message: "OK - no subscription" },
        { status: 200 },
      );
    }

    const subscription = await SubscriptionModel.findOne({
      asaasSubscriptionId,
    });

    if (!subscription) {
      console.error(
        `Webhook Asaas [${event}]: asaasSubscriptionId ${asaasSubscriptionId} não encontrada`,
      );
      // 200 para evitar retentativas infinitas do Asaas
      return NextResponse.json(
        { message: "Subscription not found" },
        { status: 200 },
      );
    }

    const subscriptionId = String(subscription._id);

    try {
      switch (event) {
        case "PAYMENT_RECEIVED":
        case "PAYMENT_CONFIRMED": {
          if (!payment) break;
          // Idempotência garantida no billing.service via paymentGatewayTransactionId único
          await activateSubscription({
            subscriptionId,
            gateway: "asaas",
            paymentId: payment.id,
            amount: payment.value,
            metadata: {
              asaasEvent: event,
              billingType: payment.billingType,
            },
          });
          break;
        }

        case "PAYMENT_OVERDUE": {
          // Guard: só marca PAST_DUE se ainda não estiver nesse estado ou pior
          if (
            subscription.status === SubscriptionStatus.PAST_DUE ||
            subscription.status === SubscriptionStatus.SUSPENDED ||
            subscription.status === SubscriptionStatus.CANCELED ||
            subscription.status === SubscriptionStatus.EXPIRED
          ) {
            break;
          }
          await markPastDue({
            subscriptionId,
            metadata: { asaasEvent: event, asaasPaymentId: payment?.id },
          });
          break;
        }

        case "PAYMENT_REFUND_DONE": {
          if (!payment) break;
          // Guard: só processa reembolso se ainda não estiver cancelada
          if (subscription.status === SubscriptionStatus.CANCELED) break;
          await refundSubscription({
            subscriptionId,
            paymentId: payment.id,
            reason: "Reembolso via Asaas",
            metadata: { asaasEvent: event, asaasPaymentId: payment.id },
          });
          break;
        }

        case "SUBSCRIPTION_DELETED": {
          // Guard: idempotente — não faz nada se já cancelada
          if (subscription.status === SubscriptionStatus.CANCELED) break;
          await cancelSubscription({
            subscriptionId,
            reason: "Cancelado via Asaas",
            metadata: { asaasEvent: event, asaasSubscriptionId },
          });
          break;
        }

        default:
          // Evento não mapeado — 200 sem erro para não gerar retentativas
          break;
      }
    } catch (err) {
      console.error(`Webhook Asaas [${event}]: erro ao processar:`, err);
      // 500 causa retentativa no Asaas — correto para falhas transitórias de banco
      return NextResponse.json({ message: "Erro interno" }, { status: 500 });
    }

    return NextResponse.json({ message: "OK" }, { status: 200 });
  });
}
