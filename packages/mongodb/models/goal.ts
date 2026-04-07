import mongoose from "mongoose";
import type { Document, Model, Types } from "mongoose";

export interface Goal {
  storeId: Types.ObjectId;
  userId: Types.ObjectId;
  targetAmount: number;
  achievedAt: Date;
  achievedMonth: number;
  achievedYear: number;
  revenue: number;
}

export interface GoalDocument extends Goal, Document {
  _id: Types.ObjectId;
}

const goalSchema = new mongoose.Schema<GoalDocument>(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetAmount: {
      type: Number,
      required: true,
    },
    achievedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    achievedMonth: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    achievedYear: {
      type: Number,
      required: true,
    },
    revenue: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

goalSchema.index({ storeId: 1, userId: 1 });
goalSchema.index({ storeId: 1, achievedYear: 1, achievedMonth: 1 });
goalSchema.index({ userId: 1, targetAmount: 1 });

goalSchema.index(
  { storeId: 1, targetAmount: 1, achievedYear: 1, achievedMonth: 1 },
  { unique: true },
);

export const GoalModel: Model<GoalDocument> =
  (mongoose.models.Goal as Model<GoalDocument>) ||
  mongoose.model<GoalDocument>("Goal", goalSchema);
