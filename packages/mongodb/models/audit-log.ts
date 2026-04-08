import mongoose from "mongoose";
import type { Document, Model, Types } from "mongoose";

export enum AuditAction {
  // Subscription
  SUBSCRIPTION_CREATED = "subscription.created",
  SUBSCRIPTION_RENEWED = "subscription.renewed",
  SUBSCRIPTION_CANCELED = "subscription.canceled",
  SUBSCRIPTION_EXPIRED = "subscription.expired",
  SUBSCRIPTION_SUSPENDED = "subscription.suspended",
  SUBSCRIPTION_REACTIVATED = "subscription.reactivated",
  SUBSCRIPTION_UPGRADED = "subscription.upgraded",
  SUBSCRIPTION_DOWNGRADED = "subscription.downgraded",

  // Invoice
  INVOICE_CREATED = "invoice.created",
  INVOICE_PAID = "invoice.paid",
  INVOICE_FAILED = "invoice.failed",
  INVOICE_REFUNDED = "invoice.refunded",
  INVOICE_CANCELED = "invoice.canceled",

  // Payment
  PAYMENT_ATTEMPT = "payment.attempt",
  PAYMENT_SUCCESS = "payment.success",
  PAYMENT_FAILED = "payment.failed",
  PAYMENT_REFUNDED = "payment.refunded",

  // Customer
  CUSTOMER_CREATED = "customer.created",
  CUSTOMER_UPDATED = "customer.updated",

  // Plan
  PLAN_CREATED = "plan.created",
  PLAN_UPDATED = "plan.updated",

  // Trial / Tolerance lifecycle
  TRIAL_GRACE_STARTED = "trial.grace_started",
  TRIAL_EXPIRED = "trial.expired",
  TOLERANCE_STARTED = "tolerance.started",
  TOLERANCE_EXPIRED = "tolerance.expired",
  SUBSCRIPTION_BLOCKED = "subscription.blocked",

  // Partner
  PARTNER_REFERRAL_CREATED = "partner.referral_created",
  PARTNER_PAYOUT_PROCESSED = "partner.payout_processed",
  ADMIN_PARTNER_CREATED = "admin.partner.created",
  ADMIN_PARTNER_UPDATED = "admin.partner.updated",
  ADMIN_PARTNER_DELETED = "admin.partner.deleted",
  PAYOUT_REQUESTED = "payout.requested",
  PAYOUT_COMPLETED = "payout.completed",

  // Admin user management
  ADMIN_USER_ROLE_CHANGED = "admin.user.role_changed",
  ADMIN_STORE_ACCESS_GRANTED = "admin.store.access_granted",
  ADMIN_STORE_ACCESS_REVOKED = "admin.store.access_revoked",

  // Admin overrides
  ADMIN_SUBSCRIPTION_OVERRIDE = "admin.subscription.override",

  // Cron
  CRON_BILLING_STARTED = "cron.billing.started",
  CRON_BILLING_COMPLETED = "cron.billing.completed",
  CRON_RETRY_STARTED = "cron.retry.started",
  CRON_RETRY_COMPLETED = "cron.retry.completed",
}

export enum AuditSeverity {
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

export interface AuditLog {
  action: AuditAction;
  severity: AuditSeverity;
  entityType: string;
  entityId?: Types.ObjectId;
  billingAccountId?: Types.ObjectId;
  description: string;
  metadata: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

export interface AuditLogDocument extends AuditLog, Document {
  createdAt: Date;
}

const auditLogSchema = new mongoose.Schema<AuditLogDocument>(
  {
    action: { type: String, required: true, enum: Object.values(AuditAction) },
    severity: {
      type: String,
      enum: Object.values(AuditSeverity),
      default: AuditSeverity.INFO,
    },
    entityType: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    billingAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BillingAccount",
    },
    description: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String },
    userAgent: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ customerId: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

export const AuditLogModel: Model<AuditLogDocument> =
  (mongoose.models.AuditLog as Model<AuditLogDocument>) ||
  mongoose.model<AuditLogDocument>("AuditLog", auditLogSchema);
