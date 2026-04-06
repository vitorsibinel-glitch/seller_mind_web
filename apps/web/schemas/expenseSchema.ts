import { z } from "zod";

export const createExpenseSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  category: z.enum([
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
  ]),
  amount: z.number().min(1, "Valor deve ser maior que zero"),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória"),

  isRecurring: z.boolean().default(false),
  recurrence: z
    .object({
      type: z.enum(["none", "daily", "weekly", "monthly", "yearly"]),
      interval: z.number().min(1).optional(),
      dueDay: z.number().min(1).max(31).optional(),
      endDate: z.string().optional(),
    })
    .optional(),

  invoiceId: z.string().optional(),
  documentRef: z.string().optional(),

  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial().extend({
  updateFuture: z.boolean().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
