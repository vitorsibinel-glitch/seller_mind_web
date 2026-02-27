import { createStockProductSchema } from "@/dtos/add-product-to-stock-dto";
import { withDB } from "@/lib/mongoose";
import { ProductModel } from "@workspace/mongodb/models/product";
import { StockMovementModel } from "@workspace/mongodb/models/stock-movement";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  return withDB(async () => {
    const url = new URL(request.url);
    const storeId = url.searchParams.get("storeId");

    if (!storeId) {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const parsed = createStockProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dados inválidos", errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const { quantity, sku } = parsed.data;

    const existingProduct = await ProductModel.findOne({ storeId, sku });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Produto não encontrado. Cadastre o produto primeiro." },
        { status: 404 }
      );
    }

    if (!existingProduct.stock) {
      existingProduct.stock = {
        localQuantity: 0,
        inTransitToFBA: 0,
      };
    }

    existingProduct.stock.localQuantity += quantity;
    existingProduct.stock.lastStockUpdate = new Date();

    await existingProduct.save();
    await StockMovementModel.create({
      productSku: existingProduct.sku,
      storeId: storeId,
      type: "ADD_TO_LOCAL_STOCK",
      quantity,
      before: {
        localQuantity: existingProduct.stock.localQuantity - quantity,
        inTransitToFBA: existingProduct.stock.inTransitToFBA,
      },
      after: {
        localQuantity: existingProduct.stock.localQuantity,
        inTransitToFBA: existingProduct.stock.inTransitToFBA,
      },
    });

    return NextResponse.json(
      {
        message: "Estoque atualizado com sucesso",
        product: {
          name: existingProduct.name,
          sku: existingProduct.sku,
          stock: existingProduct.stock,
        },
      },
      { status: 200 }
    );
  });
}
