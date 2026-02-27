export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useTry } from "@/hooks/use-try";
import { AmazonSPClient } from "@/lib/amazon-sp-client";
import { withDB } from "@/lib/mongoose";
import { IntegrationModel } from "@workspace/mongodb/models/integration";
import {
  ProductModel,
  type ProductAssociation,
} from "@workspace/mongodb/models/product";
import { StoreModel } from "@workspace/mongodb/models/store";
import { productSchema } from "@/schemas/productSchema";
import { SearchAmazonListingItems } from "@/services/search-amazon-listing-items";
import { NextResponse } from "next/server";

export async function GET(req: Request): Promise<NextResponse> {
  return withDB(async () => {
    const url = new URL(req.url);
    const storeId = url.searchParams.get("storeId")!;

    const existingStore = await StoreModel.findOne({ _id: storeId });

    if (!storeId || !existingStore) {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 }
      );
    }

    const products = await ProductModel.find({ storeId });

    return NextResponse.json({ products });
  });
}

export async function POST(req: Request): Promise<NextResponse> {
  return withDB(async () => {
    const body = await req.json();
    const url = new URL(req.url);
    const storeId = url.searchParams.get("storeId")!;
    const userIdFromHeader = req.headers.get("x-user-id");

    if (!userIdFromHeader) {
      return NextResponse.json(
        {
          message: "Usuário não identificado. Por favor, faça login novamente.",
        },
        { status: 403 }
      );
    }

    const existingStore = await StoreModel.findOne({ _id: storeId });

    if (!storeId || !existingStore) {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 }
      );
    }

    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      console.log(parsed.error);

      return NextResponse.json(
        { message: "Dados inválidos", errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      name,
      cost,
      extraCost,
      ean,
      sku,
      imageUrl: providedImage,
    } = parsed.data;

    const existingSku = await ProductModel.findOne({ sku, storeId });
    if (existingSku) {
      return NextResponse.json(
        {
          message: "Sku já cadastrado",
        },
        {
          status: 409,
        }
      );
    }

    const integration = await IntegrationModel.findOne({
      provider: "amazon_sp",
      storeId: storeId,
    });

    const associations: ProductAssociation[] = [];
    let imageUrl = providedImage;

    if (integration) {
      const [spClient, spErr] = await AmazonSPClient(storeId);
      if (spErr) {
        return NextResponse.json({ erro: spErr });
      }

      const [listingItemFromSku] = await useTry(async () => {
        const response = await spClient?.callAPI({
          operation: "listingsItems.getListingsItem",
          path: {
            sellerId: integration?.sellerId,
            sku,
          },
          query: {
            marketplaceIds: ["A2Q3Y263D00KWC"],
            includedData: ["summaries", "offers"],
          },
        });

        return response;
      });

      if (listingItemFromSku && listingItemFromSku.summaries?.[0]) {
        const externalSku = listingItemFromSku.sku;
        const externalAsin = listingItemFromSku.summaries[0].asin;

        const salePriceSku = extractSalePrice(listingItemFromSku);

        const alreadyLinked = await ProductModel.findOne({
          storeId,
          $or: [
            { "associations.externalSku": externalSku },
            { "associations.externalProductId": externalAsin },
          ],
        }).lean();

        if (!alreadyLinked) {
          associations.push({
            channel: "amazon",
            name: listingItemFromSku.summaries[0].itemName,
            externalSku,
            externalProductId: externalAsin,
            salePrice: salePriceSku ?? undefined,
            marketplaceId: listingItemFromSku.summaries[0].marketplaceId,
            linkedAt: new Date(),
          });
        }
      }

      const [listingItemsFromName] = await useTry(async () => {
        const [items, err] = await SearchAmazonListingItems(
          storeId,
          integration?.sellerId as string
        );

        if (err) throw err;

        const result = items.filter((item: any) => {
          const itemName = item.summaries?.[0]?.itemName?.toLowerCase();
          return itemName?.includes(name.toLowerCase());
        });

        const formatted = result.map((item: any) => ({
          sku: item.sku,
          asin: item.summaries[0].asin,
          name: item.summaries[0].itemName,
          salePrice: Number.isFinite(item.salePrice)
            ? item.salePrice
            : undefined,
          marketplaceId: item.summaries?.[0]?.marketplaceId,
          mainImage: item.summaries?.[0]?.mainImage.link,
        }));

        return formatted;
      });

      if (
        Array.isArray(listingItemsFromName) &&
        listingItemsFromName.length > 0
      ) {
        const currentExternalSkus = associations.map((a) => a.externalSku);
        const currentExternalAsins = associations.map(
          (a) => a.externalProductId
        );

        for (const item of listingItemsFromName) {
          const { sku: extSku, asin: extAsin } = item;

          if (
            currentExternalSkus.includes(extSku) ||
            currentExternalAsins.includes(extAsin)
          ) {
            continue;
          }

          const alreadyLinked = await ProductModel.findOne({
            storeId,
            $or: [
              { "associations.externalSku": extSku },
              { "associations.externalProductId": extAsin },
            ],
          }).lean();

          if (!alreadyLinked) {
            associations.push({
              channel: "amazon",
              name: item.name,
              externalSku: extSku,
              salePrice: Number.isFinite(item.salePrice)
                ? item.salePrice
                : undefined,
              externalProductId: extAsin,
              marketplaceId: item.marketplaceId ?? "A2Q3Y263D00KWC",
              linkedAt: new Date(),
            });

            currentExternalSkus.push(extSku);
            currentExternalAsins.push(extAsin);
          }
        }
      }

      if (!imageUrl && listingItemsFromName[0]?.mainImage) {
        imageUrl = listingItemsFromName[0].mainImage;
      }
    }

    const priceHistory: {
      amount: number;
      currency: string;
      updatedAt: Date;
      source: string;
    }[] = [];
    let lastKnownPrice:
      | { amount: number; currency: string; updatedAt: Date; source: string }
      | undefined = undefined;

    for (const assoc of associations) {
      if (assoc.salePrice != null && Number.isFinite(Number(assoc.salePrice))) {
        const entry = {
          amount: Number(assoc.salePrice),
          currency: "BRL",
          updatedAt: new Date(),
          source: "associations",
        };
        priceHistory.push(entry);
        if (!lastKnownPrice) lastKnownPrice = entry;
      }
    }

    const product = await ProductModel.create({
      storeId,
      name,
      sku,
      cost,
      extraCost,
      ean,
      imageUrl,
      lastKnownPrice: lastKnownPrice ?? undefined,
      associations,
    });

    return NextResponse.json(
      {
        message: "Produto criado com sucesso",
        productId: product,
      },
      {
        status: 201,
      }
    );
  });
}

function extractSalePrice(item: any): number | undefined {
  const offer = item?.offers?.[0];
  const price = Number(offer?.price?.amount);

  if (!price || Number.isNaN(price)) return undefined;
  return price;
}
