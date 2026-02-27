import z from "zod";

export const cancelStockMovementSchema = z.object({
  reason: z.string().min(1, "Informe o motivo do cancelamento"),
});
export type CancelStockMovementFormData = z.infer<
  typeof cancelStockMovementSchema
>;
