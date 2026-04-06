import { withDB } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SubscriptionModel } from "@workspace/mongodb/models/subscription";
import {
  activateSubscription,
  markPastDue,
  cancelSubscription,
  refundSubscription,
} from "@workspace/billing";
import { env } from "@/env";

interface EduzzWebhookPayload {
  event_type: string;
  contract: {
    contract_id: number;
    status: string;
  };
  sale: {
    sale_id: number;
    contract_id?: number;
    sale_status: string;
    tracker?: string;
    client_email: string;
    sale_amount: number;
    date_create: string;
    product_id: number;
  };
}

function validateWebhookToken(req: NextRequest): boolean {
  const token =
    req.headers.get("x-api-token") ||
    req.nextUrl.searchParams.get("api_key");
  return token === env.EDUZZ_WEBHOOK_SECRET;
}

export async function POST(req: NextRequest) {
  return withDB(async () => {
    if (!validateWebhookToken(req)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload: EduzzWebhookPayload = await req.json();
    const { sale } = payload;

    if (!sale?.tracker) {
      return NextResponse.json({ message: "OK - no tracker" }, { status: 200 });
    }

    const subscriptionId = sale.tracker;

    const subscription = await SubscriptionModel.findById(subscriptionId);
    if (!subscription) {
      console.error(
        `Webhook Eduzz: subscription ${subscriptionId} não encontrada`,
      );
      return NextResponse.json(
        { message: "Subscription not found" },
        { status: 200 },
      );
    }

    const saleStatus = sale.sale_status;
    const paymentId = String(sale.contract_id || sale.sale_id);

    try {
      if (saleStatus === "completed") {
        await activateSubscription({
          subscriptionId,
          gateway: "eduzz",
          paymentId,
          amount: sale.sale_amount,
          metadata: {
            saleId: sale.sale_id,
            eduzzContractId: sale.contract_id,
          },
        });
      } else if (saleStatus === "waiting_payment") {
        await markPastDue({
          subscriptionId,
          metadata: { saleId: sale.sale_id },
        });
      } else if (saleStatus === "refunded") {
        await refundSubscription({
          subscriptionId,
          paymentId: String(sale.sale_id),
          reason: "Reembolso via Eduzz",
          metadata: { saleId: sale.sale_id },
        });
      } else if (saleStatus === "canceled") {
        await cancelSubscription({
          subscriptionId,
          reason: "Cancelado via Eduzz",
          metadata: { saleId: sale.sale_id },
        });
      }
    } catch (err) {
      console.error(
        `Webhook Eduzz: erro ao processar evento "${saleStatus}":`,
        err,
      );
      return NextResponse.json({ message: "Erro interno" }, { status: 500 });
    }

    return NextResponse.json({ message: "OK" }, { status: 200 });
  });
}
