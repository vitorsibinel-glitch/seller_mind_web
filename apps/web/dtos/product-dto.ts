import type { ProductAssociation } from "@workspace/mongodb/models/product";
import z from "zod";

export interface ProductDTO {
  _id: string;
  name: string;
  sku: string;
  cost: number;
  extraCost: number;
  ean?: string;
  imageUrl?: string;
  associations?: ProductAssociation[];
}

export interface GetProductsResponseDTO {
  products: ProductDTO[];
}

export const createProductSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  cost: z.coerce.number().min(1, "Informe o custo"),
  sku: z.string(),
  extraCost: z.coerce.number().optional(),
  ean: z.string().optional(),
});

export type CreateProductFormData = z.infer<typeof createProductSchema>;
