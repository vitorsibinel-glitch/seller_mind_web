import mongoose from "mongoose";
import type { Document, Model } from "mongoose";

export interface Partner {
  name: string;
  email: string;
  code: string;
  commissionRate: number;
  isActive: boolean;
  pixKey?: string;
  notes?: string;
  pendingPayout: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PartnerDocument extends Partner, Document {}

const partnerSchema = new mongoose.Schema<PartnerDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    code: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    commissionRate: { type: Number, required: true, min: 0, max: 100 },
    isActive: { type: Boolean, default: true },
    pixKey: { type: String },
    notes: { type: String },
    pendingPayout: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

partnerSchema.index({ code: 1 }, { unique: true });
partnerSchema.index({ isActive: 1 });

export const PartnerModel: Model<PartnerDocument> =
  (mongoose.models.Partner as Model<PartnerDocument>) ||
  mongoose.model<PartnerDocument>("Partner", partnerSchema);
