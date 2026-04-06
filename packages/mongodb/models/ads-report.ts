import mongoose, { Schema, Document, Model, models, model } from "mongoose";

export type AdsReportStatus = "PENDING" | "COMPLETED" | "FAILURE";

export interface AdsReport {
  storeId: string;
  reportId: string;
  date: string;
  status: AdsReportStatus;
  data?: any;
  error?: string | null;
}

export interface AdsReportDocument extends AdsReport, Document {}

const adsReportSchema = new Schema<AdsReportDocument>(
  {
    storeId: { type: String, required: true, index: true },
    reportId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILURE"],
      default: "PENDING",
    },
    data: { type: Schema.Types.Mixed },
    error: { type: String, default: null },
  },
  { timestamps: true },
);

adsReportSchema.index({ reportId: 1, storeId: 1 }, { unique: true });

export const AdsReportModel: Model<AdsReportDocument> =
  (mongoose.models.AdsReport as Model<AdsReportDocument>) ||
  mongoose.model<AdsReportDocument>("AdsReport", adsReportSchema);
