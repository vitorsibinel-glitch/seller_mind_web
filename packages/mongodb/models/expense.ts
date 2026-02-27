import mongoose, { Schema, Model, Document, Types } from "mongoose";

export type ExpenseCategory =
  | "rent" // Aluguel
  | "freight" // Frete
  | "salary" // Salário
  | "utilities" // Utilidades (água, luz, internet)
  | "marketing" // Marketing
  | "supplies" // Materiais/Suprimentos
  | "maintenance" // Manutenção
  | "taxes" // Impostos
  | "services" // Serviços
  | "other"; // Outros

export type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "yearly";

export interface ExpenseRecurrence {
  type: RecurrenceType;
  interval?: number;
  dueDay?: number;
  endDate?: Date;
  nextOccurrence?: Date;
}

export interface Expense {
  description: string;
  category: ExpenseCategory;
  amount: number;
  dueDate: Date;

  isRecurring: boolean;
  recurrence?: ExpenseRecurrence;

  recurringId?: Types.ObjectId;
  invoiceId?: Types.ObjectId;
  documentRef?: string;

  storeId: Types.ObjectId;
  createdByUserId: Types.ObjectId;

  tags?: string[];
  notes?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface ExpenseDocument extends Expense, Document {}

const ExpenseRecurrenceSchema = new Schema<ExpenseRecurrence>(
  {
    type: {
      type: String,
      enum: ["none", "daily", "weekly", "monthly", "yearly"],
      required: true,
      default: "none",
    },
    interval: { type: Number, min: 1, default: 1 },
    dueDay: { type: Number, min: 1, max: 31 },
    endDate: { type: Date },
    nextOccurrence: { type: Date },
  },
  { _id: false },
);

const ExpenseSchema = new Schema<ExpenseDocument>(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: [
        "rent",
        "freight",
        "salary",
        "utilities",
        "marketing",
        "supplies",
        "maintenance",
        "taxes",
        "services",
        "other",
      ],
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    dueDate: {
      type: Date,
      required: true,
      index: true,
    },

    isRecurring: {
      type: Boolean,
      default: false,
    },

    recurringId: {
      type: Schema.Types.ObjectId,
      ref: "Expense",
      index: true,
      required: false,
    },

    recurrence: ExpenseRecurrenceSchema,

    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
    },

    documentRef: { type: String },

    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },

    createdByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    tags: {
      type: [String],
      default: [],
    },

    notes: { type: String },
  },
  { timestamps: true },
);

ExpenseSchema.index({ storeId: 1, dueDate: -1 });
ExpenseSchema.index({ storeId: 1, category: 1 });
ExpenseSchema.index({ storeId: 1, isRecurring: 1 });

ExpenseSchema.pre("validate", function () {
  if (!this.isRecurring) {
    this.recurrence = undefined;
  }
});

export const ExpenseModel: Model<ExpenseDocument> =
  (mongoose.models.Expense as Model<ExpenseDocument>) ||
  mongoose.model<ExpenseDocument>("Expense", ExpenseSchema);
