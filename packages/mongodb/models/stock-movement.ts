import mongoose, { Schema, type Model, type Types } from "mongoose";

export type StockMovementType =
  | "LOCAL_TO_FBA_TRANSIT"
  | "ADD_TO_LOCAL_STOCK"
  | "CANCEL_ADD_TO_LOCAL_STOCK"
  | "CANCEL_FBA_TRANSIT"
  | "CONFIRM_FBA_RECEIPT";

export interface StockMovement {
  productSku: string;
  storeId: Types.ObjectId;
  type: StockMovementType;
  quantity: number;
  createdAt: Date;
  before: {
    localQuantity: number;
    inTransitToFBA: number;
  };
  after: {
    localQuantity: number;
    inTransitToFBA: number;
  };
  notes?: string;
  relatedMovementId?: Types.ObjectId;
  cancelled?: boolean;
  cancelledAt?: Date;
  confirmed?: boolean;
  confirmedAt?: Date;
}

interface StockMovementDocument extends StockMovement, Document {}

const stockMovementSchema = new Schema<StockMovementDocument>(
  {
    productSku: { type: String, required: true },
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
    type: {
      type: String,
      enum: [
        "LOCAL_TO_FBA_TRANSIT",
        "ADD_TO_LOCAL_STOCK",
        "CANCEL_ADD_TO_LOCAL_STOCK",
        "CANCEL_FBA_TRANSIT",
        "CONFIRM_FBA_RECEIPT",
      ],
      required: true,
    },
    quantity: { type: Number, required: true },
    before: {
      localQuantity: { type: Number, required: true },
      inTransitToFBA: { type: Number, required: true },
    },
    after: {
      localQuantity: { type: Number, required: true },
      inTransitToFBA: { type: Number, required: true },
    },
    notes: { type: String, required: false },
    relatedMovementId: {
      type: Schema.Types.ObjectId,
      ref: "StockMovement",
      required: false,
    },
    cancelled: { type: Boolean, default: false },
    cancelledAt: { type: Date, required: false },
    confirmed: { type: Boolean, default: false },
    confirmedAt: { type: Date, required: false },
  },
  { timestamps: true }
);

stockMovementSchema.index({ storeId: 1, productSku: 1 });
stockMovementSchema.index({ createdAt: -1 });
stockMovementSchema.index({ relatedMovementId: 1 });

export const StockMovementModel: Model<StockMovementDocument> =
  (mongoose.models.StockMovement as Model<StockMovementDocument>) ||
  mongoose.model<StockMovementDocument>("StockMovement", stockMovementSchema);
