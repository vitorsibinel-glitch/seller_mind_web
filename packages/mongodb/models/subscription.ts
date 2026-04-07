import mongoose from "mongoose";
import type { Document, Model, Types } from "mongoose";

// pegar do plan para garantir consistência (fazer dps, importando de plan.js no momento)
export enum BillingCycle {
  MONTHLY = "monthly",
  ANNUAL = "annual",
}

export enum SubscriptionStatus {
  TRIALING = "trialing",
  ACTIVE = "active",
  PAST_DUE = "past_due",
  CANCELED = "canceled",
  EXPIRED = "expired",
  SUSPENDED = "suspended",
}

export interface Subscription {
  billingAccountId: Types.ObjectId;
  planId?: Types.ObjectId;
  status: SubscriptionStatus;
  billingCycle?: BillingCycle;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  trialEnd?: Date;
  canceledAt?: Date;
  cancelReason?: string;
  nextBillingDate?: Date;
  priceAtSubscription?: number; // preço no momento da assinatura
  eduzzSubscriptionId?: string;
  retryCount: number;
  lastPaymentAttempt?: Date;
  gateway?: "eduzz" | "asaas"
  asaasSubscriptionId?: string
  gracePeriodEnd?: Date
  tolerancePeriodEnd?: Date
  upgradeFromPlanId?: Types.ObjectId
  upgradedAt?: Date
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionDocument extends Subscription, Document {}

const subscriptionSchema = new mongoose.Schema<SubscriptionDocument>(
  {
    billingAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BillingAccount",
      required: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
    },
    status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.ACTIVE,
    },
    billingCycle: {
      type: String,
      enum: Object.values(BillingCycle),
    },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    trialEnd: { type: Date },
    canceledAt: { type: Date },
    cancelReason: { type: String },
    nextBillingDate: { type: Date },
    priceAtSubscription: { type: Number, default: 0 },
    eduzzSubscriptionId: { type: String },
    retryCount: { type: Number, default: 0 },
    lastPaymentAttempt: { type: Date },
    gateway: { type: String, enum: ["eduzz", "asaas"] },
    asaasSubscriptionId: { type: String },
    gracePeriodEnd: { type: Date },
    tolerancePeriodEnd: { type: Date },
    upgradeFromPlanId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan" },
    upgradedAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

subscriptionSchema.index({ billingAccountId: 1, status: 1 });
subscriptionSchema.index({ status: 1, nextBillingDate: 1 });
subscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });
subscriptionSchema.index({ eduzzSubscriptionId: 1 });
subscriptionSchema.index({ asaasSubscriptionId: 1 });
subscriptionSchema.index({ gateway: 1, status: 1 });
subscriptionSchema.index({ status: 1, trialEnd: 1 });
subscriptionSchema.index({ status: 1, tolerancePeriodEnd: 1 });

export const SubscriptionModel: Model<SubscriptionDocument> =
  (mongoose.models.Subscription as Model<SubscriptionDocument>) ||
  mongoose.model<SubscriptionDocument>("Subscription", subscriptionSchema);
