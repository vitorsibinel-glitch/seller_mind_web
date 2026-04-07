import {
  SubscriptionModel,
  SubscriptionStatus,
  BillingCycle,
} from "@workspace/mongodb/models/subscription";
import { BillingInvoiceModel } from "@workspace/mongodb/models/billing-invoice";
import {
  AuditLogModel,
  AuditAction,
  AuditSeverity,
} from "@workspace/mongodb/models/audit-log";
import { BillingAccountModel } from "@workspace/mongodb/models/billing-account";
import { UserModel } from "@workspace/mongodb/models/user";
import { PlanModel } from "@workspace/mongodb/models/plan";
import {
  sendPaymentConfirmed,
  sendPaymentFailed,
} from "../emails/billing.emails";

const PAYMENT_TOLERANCE_DAYS = 5;

export interface ActivateSubscriptionParams {
  subscriptionId: string;
  gateway: "eduzz" | "asaas";
  paymentId: string;
  amount: number;
  metadata?: Record<string, unknown>;
}

export interface MarkPastDueParams {
  subscriptionId: string;
  metadata?: Record<string, unknown>;
}

export interface CancelSubscriptionParams {
  subscriptionId: string;
  reason: string;
  metadata?: Record<string, unknown>;
}

export interface RefundSubscriptionParams {
  subscriptionId: string;
  paymentId: string;
  reason: string;
  metadata?: Record<string, unknown>;
}

/**
 * Ativa uma subscription após pagamento confirmado.
 * Idempotente: reprocessar o mesmo paymentId não cria invoice duplicada.
 */
export async function activateSubscription({
  subscriptionId,
  gateway,
  paymentId,
  amount,
  metadata = {},
}: ActivateSubscriptionParams): Promise<void> {
  const existing = await BillingInvoiceModel.findOne({
    paymentGatewayTransactionId: paymentId,
  });
  if (existing) return;

  const subscription = await SubscriptionModel.findById(subscriptionId);
  if (!subscription) {
    throw new Error(`Subscription ${subscriptionId} não encontrada`);
  }

  const now = new Date();

  subscription.status = SubscriptionStatus.ACTIVE;
  subscription.gateway = gateway;

  if (gateway === "asaas") {
    subscription.asaasSubscriptionId = paymentId;
  } else {
    subscription.eduzzSubscriptionId = paymentId;
  }

  subscription.currentPeriodStart = now;

  const periodEnd = new Date(now);
  if (subscription.billingCycle === BillingCycle.ANNUAL) {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  subscription.currentPeriodEnd = periodEnd;
  subscription.nextBillingDate = periodEnd;
  subscription.priceAtSubscription = amount;
  subscription.retryCount = 0;
  subscription.tolerancePeriodEnd = undefined;
  subscription.gracePeriodEnd = undefined;

  await subscription.save();

  const invoiceCount = await BillingInvoiceModel.countDocuments({
    subscriptionId: subscription._id,
  });

  await BillingInvoiceModel.create({
    invoiceNumber: `INV-${subscription._id}-${invoiceCount + 1}`,
    billingAccountId: subscription.billingAccountId,
    subscriptionId: subscription._id,
    amount,
    currency: "BRL",
    status: "paid",
    dueDate: now,
    paidAt: now,
    periodStart: subscription.currentPeriodStart,
    periodEnd: subscription.currentPeriodEnd,
    paymentGatewayTransactionId: paymentId,
    description: `Pagamento via ${gateway} #${paymentId}`,
    metadata: { gateway, ...metadata },
  });

  await AuditLogModel.create({
    action: AuditAction.PAYMENT_SUCCESS,
    severity: AuditSeverity.INFO,
    entityType: "Subscription",
    entityId: subscription._id,
    billingAccountId: subscription.billingAccountId,
    description: `Assinatura ativada via ${gateway}`,
    metadata: { paymentId, amount, gateway, ...metadata },
  });

  // Envia email de confirmação de pagamento (não-bloqueante)
  try {
    const billingAccount = await BillingAccountModel.findById(
      subscription.billingAccountId,
    ).lean();
    const user = billingAccount
      ? await UserModel.findById(billingAccount.userId).lean()
      : null;
    const plan = subscription.planId
      ? await PlanModel.findById(subscription.planId).lean()
      : null;

    if (user && billingAccount) {
      await sendPaymentConfirmed(
        user.email,
        user.firstName,
        plan?.name ?? "seu plano",
        amount,
      );
    }
  } catch (err) {
    console.warn("[billing.service] sendPaymentConfirmed falhou (não-bloqueante):", err);
  }

  // Cria referral de parceiro se a conta tiver referralCode (não-bloqueante)
  try {
    const { createReferral } = await import("./partner.service");
    await createReferral({
      billingAccountId: subscription.billingAccountId.toString(),
      subscriptionId,
      amount,
    });
  } catch (err) {
    console.warn("createReferral falhou (não-bloqueante):", err);
  }
}

/**
 * Marca subscription como PAST_DUE após falha de pagamento.
 * Define tolerancePeriodEnd = agora + 5 dias.
 */
export async function markPastDue({
  subscriptionId,
  metadata = {},
}: MarkPastDueParams): Promise<void> {
  const subscription = await SubscriptionModel.findById(subscriptionId);
  if (!subscription) {
    throw new Error(`Subscription ${subscriptionId} não encontrada`);
  }

  const now = new Date();
  const toleranceEnd = new Date(now);
  toleranceEnd.setDate(toleranceEnd.getDate() + PAYMENT_TOLERANCE_DAYS);

  subscription.status = SubscriptionStatus.PAST_DUE;
  subscription.retryCount = (subscription.retryCount ?? 0) + 1;
  subscription.lastPaymentAttempt = now;
  subscription.tolerancePeriodEnd = toleranceEnd;

  await subscription.save();

  await AuditLogModel.create({
    action: AuditAction.PAYMENT_FAILED,
    severity: AuditSeverity.WARN,
    entityType: "Subscription",
    entityId: subscription._id,
    billingAccountId: subscription.billingAccountId,
    description: `Pagamento falhou. Tolerância até ${toleranceEnd.toISOString()}`,
    metadata: {
      toleranceEnd,
      retryCount: subscription.retryCount,
      ...metadata,
    },
  });

  // Envia email de falha de pagamento (não-bloqueante)
  try {
    const billingAccount = await BillingAccountModel.findById(
      subscription.billingAccountId,
    ).lean();
    const user = billingAccount
      ? await UserModel.findById(billingAccount.userId).lean()
      : null;
    if (user) {
      await sendPaymentFailed(user.email, user.firstName, PAYMENT_TOLERANCE_DAYS);
    }
  } catch (err) {
    console.warn("[billing.service] sendPaymentFailed falhou (não-bloqueante):", err);
  }
}

/**
 * Cancela uma subscription.
 */
export async function cancelSubscription({
  subscriptionId,
  reason,
  metadata = {},
}: CancelSubscriptionParams): Promise<void> {
  const subscription = await SubscriptionModel.findById(subscriptionId);
  if (!subscription) {
    throw new Error(`Subscription ${subscriptionId} não encontrada`);
  }

  subscription.status = SubscriptionStatus.CANCELED;
  subscription.canceledAt = new Date();
  subscription.cancelReason = reason;

  await subscription.save();

  await AuditLogModel.create({
    action: AuditAction.SUBSCRIPTION_CANCELED,
    severity: AuditSeverity.INFO,
    entityType: "Subscription",
    entityId: subscription._id,
    billingAccountId: subscription.billingAccountId,
    description: `Assinatura cancelada: ${reason}`,
    metadata: { reason, ...metadata },
  });
}

/**
 * Processa reembolso: cancela subscription e marca invoice como reembolsada.
 */
export async function refundSubscription({
  subscriptionId,
  paymentId,
  reason,
  metadata = {},
}: RefundSubscriptionParams): Promise<void> {
  const subscription = await SubscriptionModel.findById(subscriptionId);
  if (!subscription) {
    throw new Error(`Subscription ${subscriptionId} não encontrada`);
  }

  subscription.status = SubscriptionStatus.CANCELED;
  subscription.canceledAt = new Date();
  subscription.cancelReason = reason;
  await subscription.save();

  await BillingInvoiceModel.findOneAndUpdate(
    { paymentGatewayTransactionId: paymentId },
    { status: "refunded" },
  );

  await AuditLogModel.create({
    action: AuditAction.INVOICE_REFUNDED,
    severity: AuditSeverity.INFO,
    entityType: "Subscription",
    entityId: subscription._id,
    billingAccountId: subscription.billingAccountId,
    description: `Reembolso processado: ${reason}`,
    metadata: { paymentId, reason, ...metadata },
  });
}
