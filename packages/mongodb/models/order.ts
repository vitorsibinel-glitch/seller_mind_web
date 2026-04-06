import mongoose, {
  model,
  models,
  Schema,
  type Model,
  type Types,
  type Document,
} from "mongoose";

export interface OrderItemFeeBreakdown {
  referralFee?: number;
  closingFee?: number;
  fbaFee?: number;
  other?: number;
}

export interface OrderItemFee {
  total?: number;
  breakdown?: OrderItemFeeBreakdown;
}

export interface MoneyValue {
  amount?: number;
  currency?: string;
}

export interface OrderItem {
  asin?: string;
  sellerSku?: string;
  title?: string;
  productImage?: string;

  quantity: number;

  itemPrice?: MoneyValue;
  itemTax?: MoneyValue;

  itemFee?: OrderItemFee;

  itemCost?: MoneyValue;

  itemProfit?: number;
  itemMargin?: number;

  productId?: Types.ObjectId | null;
}

export interface OrderItemDocument extends OrderItem, Document {}

export const OrderItemSchema = new Schema<OrderItemDocument>(
  {
    asin: String,
    sellerSku: String,
    title: String,
    productImage: String,

    quantity: { type: Number, required: true },

    itemPrice: {
      amount: Number,
      currency: String,
    },

    itemTax: {
      amount: Number,
      currency: String,
    },

    itemFee: {
      total: Number,
      breakdown: {
        referralFee: Number,
        closingFee: Number,
        fbaFee: Number,
        other: Number,
      },
    },

    itemCost: {
      amount: Number,
      currency: String,
    },

    itemProfit: Number,
    itemMargin: Number,

    productId: { type: Schema.Types.ObjectId, ref: "Product", default: null },
  },
  { _id: false }
);

export type OrderStatus =
  | "Pending"
  | "Unshipped"
  | "PartiallyShipped"
  | "Shipped"
  | "Delivered"
  | "Canceled"
  | "PendingCancellation"
  | "Refunded"
  | "Returned";

export interface FinancialSummary {
  totalItems?: number;
  totalTaxes?: number;
  totalFees?: number;
  totalCost?: number;
  totalRevenue?: number;
  totalProfit?: number;
  margin?: number;
  netMarketplace?: number;
}

export interface Order {
  storeId: Types.ObjectId;

  amazonOrderId: string;

  purchaseDate?: Date;
  approvalDate?: Date;

  orderDate?: Date;

  shippedAt?: Date;
  deliveredAt?: Date;

  orderStatus?: OrderStatus;

  items?: OrderItem[];

  financialSummary?: FinancialSummary;

  rawAmazonData?: any;

  syncedAt?: Date;
}

export interface OrderDocument extends Order, Document {}

const OrderSchema = new Schema<OrderDocument>(
  {
    storeId: { type: Schema.Types.ObjectId, required: true, index: true },

    amazonOrderId: { type: String, required: true },

    purchaseDate: Date,
    approvalDate: Date,

    orderDate: { type: Date, index: true },

    shippedAt: Date,
    deliveredAt: Date,

    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Unshipped",
        "PartiallyShipped",
        "Shipped",
        "Delivered",
        "Canceled",
        "PendingCancellation",
        "Refunded",
        "Returned",
      ],
      index: true,
    },

    items: [OrderItemSchema],

    financialSummary: {
      totalItems: Number,
      totalTaxes: Number,
      totalFees: Number,
      totalCost: Number,
      totalRevenue: Number,
      totalProfit: Number,
      margin: Number,
      netMarketplace: Number,
    },

    rawAmazonData: {
      type: Schema.Types.Mixed,
      default: null,
    },

    syncedAt: Date,
  },
  { timestamps: true }
);

OrderSchema.index({ amazonOrderId: 1, storeId: 1 }, { unique: true });

export const OrderModel: Model<OrderDocument> =
  (mongoose.models.Order as Model<OrderDocument>) ||
  mongoose.model<OrderDocument>("Order", OrderSchema);
