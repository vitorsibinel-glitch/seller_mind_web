import mongoose, { Schema, type Model, type Types } from "mongoose";

export type InvoiceType = "entry" | "exit";
export type InvoiceStatus = "pending" | "booked" | "canceled";

export interface Invoice {
  number: string;
  type: InvoiceType;
  emittedAt: Date;
  totalAmount: number;
  cnpjCpf: string;
  partnerName?: string;
  status: InvoiceStatus;
  xmlRaw?: any;
  note?: string;
  createdByUserId: Types.ObjectId;
  storeId: Types.ObjectId;
}

export interface InvoiceDocument extends Invoice, Document {}

const InvoiceSchema = new Schema<InvoiceDocument>({
  number: { type: String, required: true },
  type: { type: String, enum: ["entry", "exit"], required: true },
  emittedAt: { type: Date, required: true, index: true },
  totalAmount: { type: Number, required: true },
  cnpjCpf: { type: String, required: true },
  partnerName: { type: String },
  status: {
    type: String,
    enum: ["pending", "booked", "canceled"],
    required: true,
  },
  xmlRaw: { type: Schema.Types.Mixed },
  note: { type: String },
  createdByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
});

InvoiceSchema.index(
  { number: 1, storeId: 1, type: 1, cnpjCpf: 1 },
  { unique: true },
);

export const InvoiceModel: Model<InvoiceDocument> =
  (mongoose.models.Invoice as Model<InvoiceDocument>) ||
  mongoose.model<InvoiceDocument>("Invoice", InvoiceSchema);
