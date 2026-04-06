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

    const currentLocalQuantity = existingProduct.stock?.localQuantity ?? 0;
    const currentInTransit = existingProduct.stock?.inTransitToFBA ?? 0;

    if (quantity > currentLocalQuantity) {
      return NextResponse.json(
        {
          error: "Quantidade insuficiente em estoque local",
          available: currentLocalQuantity,
          requested: quantity,
        },
        { status: 400 }
      );
    }

    const newLocalQuantity = currentLocalQuantity - quantity;
    const newInTransit = currentInTransit + quantity;

    const before = {
      localQuantity: currentLocalQuantity,
      inTransitToFBA: currentInTransit,
    };

    existingProduct.stock = {
      ...existingProduct.stock,
      localQuantity: newLocalQuantity,
      inTransitToFBA: newInTransit,
      lastStockUpdate: new Date(),
    };

    await existingProduct.save();

    const after = {
      localQuantity: newLocalQuantity,
      inTransitToFBA: newInTransit,
    };

    const movement = await StockMovementModel.create({
      productSku: sku,
      storeId: existingProduct.storeId,
      type: "LOCAL_TO_FBA_TRANSIT",
      quantity,
      before,
      after,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Estoque movido para trânsito FBA com sucesso",
      product: {
        sku: existingProduct.sku,
        name: existingProduct.name,
        stock: {
          localQuantity: newLocalQuantity,
          inTransitToFBA: newInTransit,
        },
      },
      movement: {
        id: movement._id,
        type: movement.type,
        quantity: movement.quantity,
        createdAt: movement.createdAt,
        before,
        after,
      },
    });
  });
}
