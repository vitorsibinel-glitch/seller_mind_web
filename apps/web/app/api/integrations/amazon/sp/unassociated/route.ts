export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { withDB } from "@/lib/mongoose";
import { IntegrationModel } from "@workspace/mongodb/models/integration";
import { ProductModel } from "@workspace/mongodb/models/product";
import { SearchAmazonListingItems } from "@/services/search-amazon-listing-items";
import { NextResponse } from "next/server";

export async function GET(req: Request): Promise<Response> {
  return withDB(async () => {
    const url = new URL(req.url);
    const storeId = url.searchParams.get("storeId");

    if (!storeId) {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 }
      );
    }

    const integration = await IntegrationModel.findOne({
      provider: "amazon_sp",
      storeId,
    });

    const [items, err] = await SearchAmazonListingItems(
      storeId,
      integration?.sellerId as string
    );

    if (err) {
      console.error("Erro ao buscar os itens:", err);
      return NextResponse.json(
        { error: "Erro ao buscar os itens" },
        { status: 500 }
      );
    }

    const products = await ProductModel.find({ storeId });

    const externalSkus = products.flatMap(
      (p) => p.associations?.map((a) => a.externalSku).filter(Boolean) ?? []
    );

    const externalAsins = products.flatMap(
      (p) =>
        p.associations?.map((a) => a.externalProductId).filter(Boolean) ?? []
    );

    const unassociatedItems = items
      .filter(
        (item: any) =>
          !externalSkus.includes(item.sku) && !externalAsins.includes(item.asin)
      )
      .map((item: any) => {
        const summary = item.summaries?.[0];

        return {
          name: summary?.itemName || "",
          imageUrl: summary?.mainImage?.link || "",
          sku: item.sku || "",
          asin: summary?.asin || "",
          channel: "amazon",
        };
      });

    return NextResponse.json({ items: unassociatedItems });
  });
}
