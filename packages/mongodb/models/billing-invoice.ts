import mongoose from "mongoose";
import type { Document, Model, Types } from "mongoose";

export enum InvoiceStatus {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
  REFUNDED = "refunded",
  CANCELED = "canceled",
}

export interface BillingInvoice {
  invoiceNumber: string;
  billingAccountId: Types.ObjectId;
  subscriptionId: Types.ObjectId;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: Date;
  paidAt?: Date;
  periodStart: Date;
  periodEnd: Date;
  attempts: number;
  lastAttemptAt?: Date;
  paymentGatewayTransactionId?: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingInvoiceDocument extends BillingInvoice, Document {}

const billingInvoiceSchema = new mongoose.Schema<BillingInvoiceDocument>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    billingAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BillingAccount",
      required: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "BRL", uppercase: true },
    status: {
      type: String,
      enum: Object.values(InvoiceStatus),
      default: InvoiceStatus.PENDING,
    },
    dueDate: { type: Date, required: true },
    paidAt: { type: Date },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    lastAttemptAt: { type: Date },
    paymentGatewayTransactionId: { type: String },
    description: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  },
);

billingInvoiceSchema.index({ billingAccountId: 1, status: 1 });
billingInvoiceSchema.index({ subscriptionId: 1 });
billingInvoiceSchema.index({ status: 1, dueDate: 1 });

export const BillingInvoiceModel: Model<BillingInvoiceDocument> =
  (mongoose.models.BillingInvoice as Model<BillingInvoiceDocument>) ||
  mongoose.model<BillingInvoiceDocument>(
    "BillingInvoice",
    billingInvoiceSchema,
  );
