import z from "zod";

export const productSchema = z.object({
  name: z.string().min(5, "O nome do produto deve ter pelo menos 5 caractéres"),
  cost: z.number().min(0, "O custo deve ser maior ou igual a 0"),
  sku: z.string().min(10, "O sku deve ter no minimo 1 caracteres"),
  extraCost: z
    .number()
    .min(0, "O custo extra deve ser maior ou igual a 0")
    .optional(),
  ean: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const productSchemaUpdate = z.object({
  name: z.string().optional(),

  cost: z.coerce
    .number({
      invalid_type_error: "Informe um valor válido",
    })
    .min(0, "O custo deve ser maior ou igual a 0")
    .optional(),

  extraCost: z.coerce
    .number({
      invalid_type_error: "Informe um valor válido",
    })
    .min(0, "O custo extra deve ser maior ou igual a 0")
    .optional(),

  sku: z.string().min(10, "O sku deve ter no mínimo 10 caracteres").optional(),
  ean: z.string().optional(),
  imageUrl: z.string().optional(),
});

export type LoginFormData = z.infer<typeof productSchema>;
