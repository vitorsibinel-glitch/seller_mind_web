import mongoose from "mongoose";
import type { Document, Model } from "mongoose";

export type UserRole = "user" | "manager" | "creator";

export interface User {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string | null;
  isStoreIntegrated: boolean;
  document: string;
  phone: string;
  role: UserRole;
}

export interface UserDocument extends User, Document {}

const userSchema = new mongoose.Schema<UserDocument>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true, select: false },
    avatarUrl: { type: String },
    phone: { type: String },
    document: { type: String },
    isStoreIntegrated: { type: Boolean, default: false },
    role: { type: String, enum: ["user", "manager", "creator"], default: "user" },
  },
  { timestamps: true },
);

export const UserModel: Model<UserDocument> =
  (mongoose.models.User as Model<UserDocument>) ||
  mongoose.model<UserDocument>("User", userSchema);
