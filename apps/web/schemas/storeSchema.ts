import z from "zod";

export const updateStoreSchema = z.object({
  name: z
    .string()
    .min(3, "Nome da loja deve ter pelo menos 3 caractéres")
    .optional(),
  taxRate: z.coerce
    .number()
    .min(0, "Taxa de imposto não pode ser negativa")
    .optional(),
});
