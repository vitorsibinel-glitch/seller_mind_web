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
  planId: Types.ObjectId;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  canceledAt?: Date;
  cancelReason?: string;
  nextBillingDate: Date;
  priceAtSubscription: number; // preço no momento da assinatura
  retryCount: number;
  lastPaymentAttempt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface SubscriptionDocument extends Subscription, Document {}

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
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.ACTIVE,
    },
    billingCycle: {
      type: String,
      enum: Object.values(BillingCycle),
      required: true,
    },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },
    trialEnd: { type: Date },
    canceledAt: { type: Date },
    cancelReason: { type: String },
    nextBillingDate: { type: Date, required: true },
    priceAtSubscription: { type: Number, required: true },
    retryCount: { type: Number, default: 0 },
    lastPaymentAttempt: { type: Date },
  },
  {
    timestamps: true,
  },
);

subscriptionSchema.index({ billingAccountId: 1, status: 1 });
subscriptionSchema.index({ status: 1, nextBillingDate: 1 });
subscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });

export const SubscriptionModel: Model<SubscriptionDocument> =
  (mongoose.models.Subscription as Model<SubscriptionDocument>) ||
  mongoose.model<SubscriptionDocument>("Subscription", subscriptionSchema);
