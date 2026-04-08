import mongoose from "mongoose";
import type { Document, Model, Types } from "mongoose";

export interface Payout {
  partnerId: Types.ObjectId;           // ref: Partner (required)
  partnerName: string;                 // Partner.name (snapshot at payout time)
  partnerCode: string;                 // Partner.code (snapshot at payout time)
  amount: number;                      // R$ 100.00 (total payout amount)
  pixKey: string;                      // "123.456.789-10@pixkey.com" (snapshot at request time)
  referralIds: Types.ObjectId[];       // ref: PartnerReferral[] (commissions included in this payout)
  status: "pending" | "processing" | "completed" | "failed";
  transactionId?: string;              // PIX transaction ID (manual entry or future API)
  requestedAt: Date;                   // when admin requested payout
  completedAt?: Date;                  // when status changed to "completed"
  createdAt: Date;
  updatedAt: Date;
}

export interface PayoutDocument extends Payout, Document {}

const payoutSchema = new mongoose.Schema<PayoutDocument>(
  {
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      required: true,
    },
    partnerName: { type: String, required: true },
    partnerCode: { type: String, required: true },
    amount: { type: Number, required: true },
    pixKey: { type: String, required: true },
    referralIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PartnerReferral",
      },
    ],
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    transactionId: { type: String },
    requestedAt: { type: Date, required: true, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes
payoutSchema.index({ partnerId: 1, status: 1 });
payoutSchema.index({ status: 1 });
payoutSchema.index({ requestedAt: 1 });

export const PayoutModel: Model<PayoutDocument> =
  (mongoose.models.Payout as Model<PayoutDocument>) ||
  mongoose.model<PayoutDocument>("Payout", payoutSchema);
