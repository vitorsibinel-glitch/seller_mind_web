import mongoose, {
  model,
  models,
  Schema,
  type Model,
  type Types,
} from "mongoose";

export interface PriceHistoryEntry {
  amount: number;
  currency: string;
  updatedAt: Date;
  source: string;
}

export interface ProductAssociation {
  channel: string;
  name: string;
  salePrice?: number | null;
  externalProductId?: string;
  externalSku?: string;
  marketplaceId?: string;
  linkedAt?: Date;
}

export interface StockInfo {
  localQuantity: number;

  inTransitToFBA: number;
  lastStockUpdate?: Date;
}

export interface Product {
  storeId: Types.ObjectId;
  name: string;
  sku: string;
  cost: number;
  extraCost?: number;
  ean?: string;
  imageUrl?: string;
  associations?: ProductAssociation[];
  stock?: StockInfo;
  lastKnownPrice?: PriceHistoryEntry;
  priceHistory?: PriceHistoryEntry[];
}

export interface ProductDocument extends Product, Document {}

const priceHistorySchema = new Schema<PriceHistoryEntry>(
  {
    amount: { type: Number, required: true },
    currency: { type: String, default: "BRL" },
    updatedAt: { type: Date, default: Date.now },
    source: { type: String, required: true },
  },
  { _id: false }
);

const productAssociationSchema = new Schema<ProductAssociation>(
  {
    name: { type: String },
    channel: { type: String, required: true },
    externalProductId: { type: String },
    externalSku: { type: String },
    salePrice: { type: Number },
    marketplaceId: { type: String },
    linkedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const stockInfoSchema = new Schema<StockInfo>(
  {
    localQuantity: { type: Number, default: 0 },
    inTransitToFBA: { type: Number, default: 0 },
    lastStockUpdate: { type: Date, default: Date.now },
  },
  { _id: false }
);

const productSchema = new Schema<ProductDocument>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    cost: { type: Number, required: true },
    extraCost: { type: Number },
    ean: { type: String },
    imageUrl: { type: String },

    associations: {
      type: [productAssociationSchema],
      default: [],
    },

    stock: {
      type: stockInfoSchema,
      default: () => ({
        localQuantity: 0,
        fbaQuantity: 0,
        inTransitToFBA: 0,
      }),
    },

    lastKnownPrice: priceHistorySchema,

    priceHistory: {
      type: [priceHistorySchema],
      default: [],
    },
  },
  { timestamps: true }
);

productSchema.index({ storeId: 1, sku: 1 }, { unique: true });

export const ProductModel: Model<ProductDocument> =
  (mongoose.models.Product as Model<ProductDocument>) ||
  mongoose.model<ProductDocument>("Product", productSchema);
