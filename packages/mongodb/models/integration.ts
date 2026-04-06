import mongoose from "mongoose";
import type { Document, Model, Types } from "mongoose";

export interface Integration {
  storeId: Types.ObjectId;
  provider: "amazon_ads" | "amazon_sp";
  status: "connected" | "error" | "disconnected";
  lastSync?: Date;
  refreshToken: string;
  metadata?: IntegrationMetadata;
  accountName?: string;
  profileId?: string;
  sellerId?: string;
}

export interface IntegrationMetadata {
  historicalSyncCompleted?: boolean;
  historicalSyncDate?: Date;
  historicalSyncDaysBack?: number;
}

export interface IntegrationDocument extends Integration, Document {}

const integrationSchema = new mongoose.Schema<IntegrationDocument>(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    provider: {
      type: String,
      enum: ["amazon_ads", "amazon_sp"],
      required: true,
    },
    status: {
      type: String,
      enum: ["connected", "error", "disconnected"],
      default: "disconnected",
    },
    metadata: {
      historicalSyncCompleted: { type: Boolean, default: false },
      historicalSyncDate: { type: Date },
      historicalSyncDaysBack: { type: Number },
    },
    refreshToken: { type: String, required: true, select: false },
    lastSync: { type: Date },
    accountName: { type: String },
    profileId: { type: String },
    sellerId: { type: String },
  },
  { timestamps: true },
);

export const IntegrationModel: Model<IntegrationDocument> =
  (mongoose.models.Integration as Model<IntegrationDocument>) ||
  mongoose.model<IntegrationDocument>("Integration", integrationSchema);
