import mongoose from "mongoose";
import type { Document, Model, Types } from "mongoose";

export interface UserStoreAccess {
  managerId: Types.ObjectId;
  storeId: Types.ObjectId;
  grantedByAdminId: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStoreAccessDocument extends UserStoreAccess, Document {}

const userStoreAccessSchema = new mongoose.Schema<UserStoreAccessDocument>(
  {
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    grantedByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

userStoreAccessSchema.index({ managerId: 1, isActive: 1 });
userStoreAccessSchema.index({ storeId: 1, isActive: 1 });
userStoreAccessSchema.index({ managerId: 1, storeId: 1 }, { unique: true });

export const UserStoreAccessModel: Model<UserStoreAccessDocument> =
  (mongoose.models.UserStoreAccess as Model<UserStoreAccessDocument>) ||
  mongoose.model<UserStoreAccessDocument>(
    "UserStoreAccess",
    userStoreAccessSchema,
  );
