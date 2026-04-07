import mongoose from "mongoose";
import type { Document, Model, Types } from "mongoose";

export type PartnerReferralStatus = "pending" | "paid" | "canceled";

export interface PartnerReferral {
  partnerId: Types.ObjectId;
  userId: Types.ObjectId;
  billingAccountId: Types.ObjectId;
  subscriptionId?: Types.ObjectId;
  commissionRate: number;
  commissionAmount: number;
  status: PartnerReferralStatus;
  paidAt?: Date;
  payoutReference?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PartnerReferralDocument extends PartnerReferral, Document {}

const partnerReferralSchema = new mongoose.Schema<PartnerReferralDocument>(
  {
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    billingAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BillingAccount",
      required: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
    },
    commissionRate: { type: Number, required: true },
    commissionAmount: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ["pending", "paid", "canceled"],
      default: "pending",
    },
    paidAt: { type: Date },
    payoutReference: { type: String },
  },
  { timestamps: true },
);

partnerReferralSchema.index({ partnerId: 1, status: 1 });
partnerReferralSchema.index({ userId: 1 });
partnerReferralSchema.index({ subscriptionId: 1 });

export const PartnerReferralModel: Model<PartnerReferralDocument> =
  (mongoose.models.PartnerReferral as Model<PartnerReferralDocument>) ||
  mongoose.model<PartnerReferralDocument>(
    "PartnerReferral",
    partnerReferralSchema,
  );
