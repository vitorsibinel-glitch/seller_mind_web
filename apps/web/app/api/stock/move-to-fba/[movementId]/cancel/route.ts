import { cancelStockMovementSchema } from "@/dtos/cancel-movement-dto";
import { withDB } from "@/lib/mongoose";
import { ProductModel } from "@workspace/mongodb/models/product";
import { StockMovementModel } from "@workspace/mongodb/models/stock-movement";
import { NextResponse } from "next/server";

export async function POST(
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

    const body = await request.json();

    const parsed = cancelStockMovementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dados inválidos", errors: parsed.error.format() },
        { status: 400 },
      );
    }

    const { reason } = parsed.data;
    const { movementId } = await params;

    const originalMovement = await StockMovementModel.findOne({
      _id: movementId,
      storeId,
      type: "LOCAL_TO_FBA_TRANSIT",
    });

    if (!originalMovement) {
      return NextResponse.json(
        {
          error:
            "Movimento de envio para FBA não encontrado ou não pode ser cancelado",
        },
        { status: 404 },
      );
    }

    const alreadyCancelled = await StockMovementModel.findOne({
      storeId,
      productSku: originalMovement.productSku,
      type: "CANCEL_FBA_TRANSIT",
      relatedMovementId: originalMovement._id,
    });

    if (alreadyCancelled) {
      return NextResponse.json(
        { error: "Este envio já foi cancelado" },
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

    const currentInTransit = product.stock?.inTransitToFBA || 0;
    if (currentInTransit < originalMovement.quantity) {
      return NextResponse.json(
        {
          error: `Quantidade em trânsito insuficiente para cancelar. Em trânsito atual: ${currentInTransit}, quantidade a cancelar: ${originalMovement.quantity}`,
        },
        { status: 400 },
      );
    }

    const beforeLocal = product.stock?.localQuantity ?? 0;
    const beforeInTransit = currentInTransit;

    product.stock!.inTransitToFBA = beforeInTransit - originalMovement.quantity;
    product.stock!.localQuantity = beforeLocal + originalMovement.quantity;
    product.stock!.lastStockUpdate = new Date();

    await product.save();

    const cancellationMovement = await StockMovementModel.create({
      productSku: product.sku,
      storeId: storeId,
      type: "CANCEL_FBA_TRANSIT",
      quantity: originalMovement.quantity,
      before: {
        localQuantity: beforeLocal,
        inTransitToFBA: beforeInTransit,
      },
      after: {
        localQuantity: product.stock!.localQuantity,
        inTransitToFBA: product.stock!.inTransitToFBA,
      },
      notes: `Cancelamento do envio para FBA ${movementId}${reason ? ` - Motivo: ${reason}` : ""}`,
      relatedMovementId: originalMovement._id,
      cancelled: true,
      cancelledAt: new Date(),
    });

    return NextResponse.json(
      {
        message: "Envio para FBA cancelado com sucesso",
        product: {
          name: product.name,
          sku: product.sku,
          stock: product.stock,
        },
        cancelledMovement: {
          id: movementId,
          quantity: originalMovement.quantity,
          cancellationId: cancellationMovement._id,
        },
      },
      { status: 200 },
    );
  });
}
