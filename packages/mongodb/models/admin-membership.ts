import mongoose from "mongoose";
import type { Document, Model, Types } from "mongoose";

export interface AdminMembership {
  userId: Types.ObjectId;
  grantedByAdminId?: Types.ObjectId;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AdminMembershipDocument extends AdminMembership, Document {}

const adminMembershipSchema = new mongoose.Schema<AdminMembershipDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    grantedByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isActive: { type: Boolean, default: true },
    notes: { type: String },
  },
  { timestamps: true },
);

adminMembershipSchema.index({ userId: 1 }, { unique: true });
adminMembershipSchema.index({ isActive: 1 });

export const AdminMembershipModel: Model<AdminMembershipDocument> =
  (mongoose.models.AdminMembership as Model<AdminMembershipDocument>) ||
  mongoose.model<AdminMembershipDocument>(
    "AdminMembership",
    adminMembershipSchema,
  );
