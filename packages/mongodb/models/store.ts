import mongoose from "mongoose";
import type { Document, Model, Types } from "mongoose";

export interface Store {
  userId: Types.ObjectId;
  name: string;
  logoUrl?: string | null;
  active: boolean;
  taxRate: number;
}

interface StoreDocument extends Store, Document {
  _id: Types.ObjectId;
}

const storeSchema = new mongoose.Schema<StoreDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    taxRate: { type: Number, required: true, default: 4 },
    name: { type: String, required: true },
    logoUrl: { type: String },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

storeSchema.index({ userId: 1, active: 1 });

export const StoreModel: Model<StoreDocument> =
  (mongoose.models.Store as Model<StoreDocument>) ||
  mongoose.model<StoreDocument>("Store", storeSchema);
