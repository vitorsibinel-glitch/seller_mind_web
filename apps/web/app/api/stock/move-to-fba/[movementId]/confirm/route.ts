import { withDB } from "@/lib/mongoose";
import { ProductModel } from "@workspace/mongodb/models/product";
import { StockMovementModel } from "@workspace/mongodb/models/stock-movement";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ movementId: string }> },
) {
  return withDB(async () => {
    const url = new URL(request.url);
    const storeId = url.searchParams.get("storeId");

    if (!storeId) {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 400 },
      );
    }

    const { movementId } = await params;

    const originalMovement = await StockMovementModel.findOne({
      _id: movementId,
      storeId,
      type: "LOCAL_TO_FBA_TRANSIT",
    });

    if (!originalMovement) {
      return NextResponse.json(
        { error: "Envio para FBA não encontrado" },
        { status: 404 },
      );
    }

    const alreadyHandled = await StockMovementModel.findOne({
      relatedMovementId: originalMovement._id,
      type: { $in: ["CANCEL_FBA_TRANSIT", "CONFIRM_FBA_RECEIPT"] },
    });

    if (alreadyHandled) {
      return NextResponse.json(
        { error: "Este envio já foi finalizado" },
        { status: 400 },
      );
    }

    const product = await ProductModel.findOne({
      storeId,
      sku: originalMovement.productSku,
    });

    if (!product) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 },
      );
    }

    const currentInTransit = product.stock?.inTransitToFBA ?? 0;

    if (currentInTransit < originalMovement.quantity) {
      return NextResponse.json(
        {
          error: `Quantidade em trânsito insuficiente para confirmar. Em trânsito atual: ${currentInTransit}`,
        },
        { status: 400 },
      );
    }

    const beforeLocal = product.stock?.localQuantity ?? 0;
    const beforeInTransit = currentInTransit;

    product.stock!.inTransitToFBA = beforeInTransit - originalMovement.quantity;
    product.stock!.lastStockUpdate = new Date();

    await product.save();

    const confirmationMovement = await StockMovementModel.create({
      productSku: product.sku,
      storeId,
      type: "CONFIRM_FBA_RECEIPT",
      quantity: originalMovement.quantity,
      before: {
        localQuantity: beforeLocal,
        inTransitToFBA: beforeInTransit,
      },
      after: {
        localQuantity: product.stock!.localQuantity,
        inTransitToFBA: product.stock!.inTransitToFBA,
      },
      notes: `Recebimento FBA confirmado para o envio ${movementId}`,
      relatedMovementId: originalMovement._id,
    });

    return NextResponse.json(
      {
        message: "Recebimento FBA confirmado com sucesso",
        confirmedMovement: confirmationMovement._id,
        product: {
          sku: product.sku,
          stock: product.stock,
        },
      },
      { status: 200 },
    );
  });
}
