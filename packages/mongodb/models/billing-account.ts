import mongoose from "mongoose";
import type { Document, Model, Types } from "mongoose";

export interface CardData {
  holder: string;
  number: string;
  expiry_month: string;
  expiry_year: string;
  cvv: string;
  doc_number: string;
}

export interface PaymentMethod {
  provider: string;
  cardToken?: string;
  card?: CardData;
}

export interface BillingAccount {
  name: string;
  email: string;
  document: string;
  phone?: string;
  metadata: Record<string, unknown>;
  paymentGatewayId?: string;
  paymentMethod?: PaymentMethod;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: Types.ObjectId;
}

interface BillingAccountDocument extends BillingAccount, Document {}

const cardDataSchema = new mongoose.Schema<CardData>(
  {
    holder: { type: String, required: true },
    number: { type: String, required: true },
    expiry_month: { type: String, required: true },
    expiry_year: { type: String, required: true },
    cvv: { type: String, required: true },
    doc_number: { type: String, required: true },
  },
  { _id: false },
);

const paymentMethodSchema = new mongoose.Schema<PaymentMethod>(
  {
    provider: { type: String, required: true },
    cardToken: { type: String },
    card: { type: cardDataSchema },
  },
  { _id: false },
);

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
    paymentGatewayId: { type: String },
    paymentMethod: { type: paymentMethodSchema },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

billingAccountSchema.index({ userId: 1 });
billingAccountSchema.index({ document: 1 });
billingAccountSchema.index({ paymentGatewayId: 1 });

export const BillingAccountModel: Model<BillingAccountDocument> =
  (mongoose.models.BillingAccount as Model<BillingAccountDocument>) ||
  mongoose.model<BillingAccountDocument>(
    "BillingAccount",
    billingAccountSchema,
  );
