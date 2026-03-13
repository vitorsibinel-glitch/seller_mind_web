import { withDB } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SubscriptionModel, SubscriptionStatus, BillingCycle } from "@workspace/mongodb/models/subscription";
import { BillingInvoiceModel } from "@workspace/mongodb/models/billing-invoice";
import { AuditLogModel } from "@workspace/mongodb/models/audit-log";
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
  const token = req.headers.get("x-api-token") || req.nextUrl.searchParams.get("api_key");
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
      console.error(`Webhook Eduzz: subscription ${subscriptionId} não encontrada`);
      return NextResponse.json({ message: "Subscription not found" }, { status: 200 });
    }

    const saleStatus = sale.sale_status;

    if (saleStatus === "completed") {
      const now = new Date();

      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.eduzzSubscriptionId = String(sale.contract_id || sale.sale_id);
      subscription.currentPeriodStart = now;

      const periodEnd = new Date(now);
      if (subscription.billingCycle === BillingCycle.ANNUAL) {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }
      subscription.currentPeriodEnd = periodEnd;
      subscription.nextBillingDate = periodEnd;
      subscription.priceAtSubscription = sale.sale_amount;
      subscription.retryCount = 0;
      await subscription.save();

      const invoiceCount = await BillingInvoiceModel.countDocuments({
        subscriptionId: subscription._id,
      });

      await BillingInvoiceModel.create({
        invoiceNumber: `INV-${subscription._id}-${invoiceCount + 1}`,
        billingAccountId: subscription.billingAccountId,
        subscriptionId: subscription._id,
        amount: sale.sale_amount,
        currency: "BRL",
        status: "paid",
        dueDate: now,
        paidAt: now,
        periodStart: subscription.currentPeriodStart,
        periodEnd: subscription.currentPeriodEnd,
        paymentGatewayTransactionId: String(sale.sale_id),
        description: `Pagamento assinatura - Eduzz Sale #${sale.sale_id}`,
      });

      await AuditLogModel.create({
        action: "PAYMENT_SUCCESS",
        subscriptionId: subscription._id,
        billingAccountId: subscription.billingAccountId,
        metadata: { saleId: sale.sale_id, amount: sale.sale_amount },
      });
    } else if (saleStatus === "waiting_payment") {
      subscription.status = SubscriptionStatus.PAST_DUE;
      subscription.retryCount = (subscription.retryCount || 0) + 1;
      subscription.lastPaymentAttempt = new Date();
      await subscription.save();

      await AuditLogModel.create({
        action: "PAYMENT_FAILED",
        subscriptionId: subscription._id,
        billingAccountId: subscription.billingAccountId,
        metadata: { saleId: sale.sale_id },
      });
    } else if (saleStatus === "refunded") {
      subscription.status = SubscriptionStatus.CANCELED;
      subscription.canceledAt = new Date();
      subscription.cancelReason = "Reembolso via Eduzz";
      await subscription.save();

      await BillingInvoiceModel.findOneAndUpdate(
        { paymentGatewayTransactionId: String(sale.sale_id) },
        { status: "refunded" },
      );

      await AuditLogModel.create({
        action: "INVOICE_REFUNDED",
        subscriptionId: subscription._id,
        billingAccountId: subscription.billingAccountId,
        metadata: { saleId: sale.sale_id },
      });
    } else if (saleStatus === "canceled") {
      subscription.status = SubscriptionStatus.CANCELED;
      subscription.canceledAt = new Date();
      subscription.cancelReason = "Cancelado via Eduzz";
      await subscription.save();

      await AuditLogModel.create({
        action: "SUBSCRIPTION_CANCELED",
        subscriptionId: subscription._id,
        billingAccountId: subscription.billingAccountId,
        metadata: { saleId: sale.sale_id },
      });
    }

    return NextResponse.json({ message: "OK" }, { status: 200 });
  });
}
