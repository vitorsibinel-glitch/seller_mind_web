import mongoose from "mongoose";
import type { Document, Model, Types } from "mongoose";

export interface BillingAccount {
  userId: Types.ObjectId;
  name: string;
  email: string;
  document: string;
  phone?: string;
  metadata: Record<string, unknown>;
  isActive: boolean;
  gateway?: "eduzz" | "asaas"
  asaasCustomerId?: string
  referralCode?: string
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingAccountDocument extends BillingAccount, Document {}

const billingAccountSchema = new mongoose.Schema<BillingAccountDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    document: { type: String, default: "" },
    phone: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true },
    gateway: { type: String, enum: ["eduzz", "asaas"] },
    asaasCustomerId: { type: String },
    referralCode: { type: String },
  },
  {
    timestamps: true,
  },
);

billingAccountSchema.index({ userId: 1 });
billingAccountSchema.index({ document: 1 });
billingAccountSchema.index({ asaasCustomerId: 1 });

export const BillingAccountModel: Model<BillingAccountDocument> =
  (mongoose.models.BillingAccount as Model<BillingAccountDocument>) ||
  mongoose.model<BillingAccountDocument>(
    "BillingAccount",
    billingAccountSchema,
  );
