import mongoose from "mongoose";
import type { Document, Model } from "mongoose";

export enum BillingCycle {
  MONTHLY = "monthly",
  ANNUAL = "annual",
}

export enum PlanTier {
  BASIC = "basic",
  ADVANCED = "advanced",
}

export interface Plan {
  name: string;
  slug: string;
  tier: PlanTier;
  description: string;
  features: string[];
  prices: {
    monthly: number;
    annual: number;
  };
  currency: string;
  isActive: boolean;
  trialDays: number;
  sortOrder: number;
  isPopular: boolean; // para destacar o plano mais popular

  limits: {
    maxOrders?: number;
    gamificationBonus?: number;
    users?: number;
    stores?: number;
    storage?: number;
    apiCalls?: number;
  };
}

interface PlanDocument extends Plan, Document {
  createdAt: Date;
  updatedAt: Date;
}

const planSchema = new mongoose.Schema<PlanDocument>(
  {
    name: { type: String, required: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    tier: {
      type: String,
      enum: Object.values(PlanTier),
      required: true,
      index: true,
    },
    description: { type: String, default: "" },
    features: [{ type: String }],
    prices: {
      monthly: { type: Number, required: true, min: 0 },
      annual: { type: Number, required: true, min: 0 },
    },
    currency: {
      type: String,
      default: "BRL",
      uppercase: true,
    },
    isActive: { type: Boolean, default: true },
    trialDays: { type: Number, default: 20, min: 0 }, // 20 dias grátis
    sortOrder: { type: Number, default: 0 },
    isPopular: { type: Boolean, default: false },

    limits: {
      maxOrders: { type: Number, required: false, min: 0 },
      gamificationBonus: { type: Number, required: false, min: 0 },
      users: { type: Number, default: 1, min: 1 },
      stores: { type: Number, default: 1, min: 1 },
      storage: { type: Number },
      apiCalls: { type: Number },
    },
  },
  { timestamps: true },
);

planSchema.index({ isActive: 1, sortOrder: 1 });

export const PlanModel: Model<PlanDocument> =
  (mongoose.models.Plan as Model<PlanDocument>) ||
  mongoose.model<PlanDocument>("Plan", planSchema);
