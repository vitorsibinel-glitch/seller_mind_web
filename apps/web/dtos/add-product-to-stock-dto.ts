import z from "zod";

export interface StockProductDTO {
  quantity: number;
  sku: string;
}

export const createStockProductSchema = z.object({
  quantity: z.coerce.number().min(1, "Informe a quantidade"),
  sku: z.string(),
});

export type CreateStockProductFormData = z.infer<
  typeof createStockProductSchema
>;
