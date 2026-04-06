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
      type: "ADD_TO_LOCAL_STOCK",
    });

    if (!originalMovement) {
      return NextResponse.json(
        {
          error:
            "Movimento de estoque não encontrado ou não pode ser cancelado",
        },
        { status: 404 },
      );
    }

    const alreadyCancelled = await StockMovementModel.findOne({
      storeId,
      productSku: originalMovement.productSku,
      type: "CANCEL_ADD_TO_LOCAL_STOCK",
      relatedMovementId: originalMovement._id,
    });

    if (alreadyCancelled) {
      return NextResponse.json(
        { error: "Este movimento já foi cancelado" },
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

    const currentLocalQuantity = product.stock?.localQuantity || 0;
    if (currentLocalQuantity < originalMovement.quantity) {
      return NextResponse.json(
        {
          error: `Estoque insuficiente para cancelar. Estoque atual: ${currentLocalQuantity}, quantidade a cancelar: ${originalMovement.quantity}`,
        },
        { status: 400 },
      );
    }

    const beforeQuantity = currentLocalQuantity;
    product.stock!.localQuantity -= originalMovement.quantity;
    product.stock!.lastStockUpdate = new Date();

    await product.save();

    const cancellationMovement = await StockMovementModel.create({
      productSku: product.sku,
      storeId: storeId,
      type: "CANCEL_ADD_TO_LOCAL_STOCK",
      quantity: originalMovement.quantity,
      before: {
        localQuantity: beforeQuantity,
        inTransitToFBA: product.stock!.inTransitToFBA,
      },
      after: {
        localQuantity: product.stock!.localQuantity,
        inTransitToFBA: product.stock!.inTransitToFBA,
      },
      notes: `Cancelamento do movimento ${movementId}${reason ? ` - Motivo: ${reason}` : ""}`,
      relatedMovementId: originalMovement._id,
      cancelled: true,
      cancelledAt: new Date(),
    });

    return NextResponse.json(
      {
        message: "Adição de estoque cancelada com sucesso",
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
