import { withDB } from "@/lib/mongoose";
import { ProductModel } from "@workspace/mongodb/models/product";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
): Promise<NextResponse> {
  return withDB(async () => {
    const { productId } = await params;
    const url = new URL(req.url);
    const storeId = url.searchParams.get("storeId")!;

    if (!storeId) {
      return NextResponse.json(
        { message: "Loja não encontrada" },
        { status: 404 }
      );
    }

    const product = await ProductModel.findOne({
      _id: productId,
      storeId,
    });

    if (!product) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    const associations =
      product.associations?.map((assoc) => ({
        name: assoc.name ?? product.name,
        imageUrl: product.imageUrl ?? null, // adicionar imagem a cada associação futuramente
        sku: assoc.externalSku ?? null,
        asin: assoc.externalProductId ?? null,
        channel: assoc.channel ?? "amazon",
      })) ?? [];

    return NextResponse.json({ associations });
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  return withDB(async () => {
    const { productId } = await params;
    const url = new URL(req.url);
    const storeId = url.searchParams.get("storeId");

    if (!storeId) {
      return NextResponse.json(
        {
          message: "loja não encontrada",
        },
        { status: 404 }
      );
    }

    const product = await ProductModel.findOne({
      _id: productId,
      storeId,
    });

    if (!product) {
      return NextResponse.json(
        { message: "Produto não encontrado" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { associations } = body;

    if (!Array.isArray(associations)) {
      return NextResponse.json(
        { message: "Associações inválidas" },
        { status: 400 }
      );
    }

    const existingSkus = new Set<string>();
    const existingAsins = new Set<string>();

    for (const assoc of associations) {
      if (assoc.externalSku) {
        if (existingSkus.has(assoc.externalSku)) {
          return NextResponse.json(
            { message: `SKU duplicado: ${assoc.externalSku}` },
            { status: 400 }
          );
        }
        existingSkus.add(assoc.externalSku);
      }

      if (assoc.externalProductId) {
        if (existingAsins.has(assoc.externalProductId)) {
          return NextResponse.json(
            { message: `ASIN duplicado: ${assoc.externalProductId}` },
            { status: 400 }
          );
        }
        existingAsins.add(assoc.externalProductId);
      }
    }

    const alreadyLinked = await ProductModel.findOne({
      _id: { $ne: productId },
      storeId,
      $or: [
        { "associations.externalSku": { $in: Array.from(existingSkus) } },
        {
          "associations.externalProductId": { $in: Array.from(existingAsins) },
        },
      ],
    }).lean();

    if (alreadyLinked) {
      return NextResponse.json(
        { message: "Um ou mais anúncios já estão associados a outro produto" },
        { status: 409 }
      );
    }

    const formattedAssociations = associations.map((assoc) => ({
      channel: assoc.channel ?? "amazon",
      name: assoc.name,
      externalSku: assoc.externalSku ?? undefined,
      externalProductId: assoc.externalProductId ?? undefined,
      salePrice: assoc.salePrice ?? undefined,
      marketplaceId: assoc.marketplaceId ?? "A2Q3Y263D00KWC",
      linkedAt: assoc.linkedAt ?? new Date(),
    }));

    product.associations = formattedAssociations;
    await product.save();

    return NextResponse.json({
      message: "Associações atualizadas com sucesso",
      associations: product.associations,
    });
  });
}
