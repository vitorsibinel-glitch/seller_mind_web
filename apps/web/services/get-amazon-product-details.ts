import { AmazonSPClient } from "@/lib/amazon-sp-client";

export async function GetAmazonProductDetails(storeId: string, asin: string) {
  const [spClient, error] = await AmazonSPClient(storeId);
  if (error) throw new Error("Erro ao inicializar SP Client");

  const res = await spClient?.callAPI({
    api_path: "/catalog/v0/items/{asin}",
    method: "GET",
    path: { asin },
    query: {
      MarketplaceId: "A2Q3Y263D00KWC",
    },
    operation: "getPricing",
  });

  const payload = res?.payload?.AttributeSets?.[0];
  return {
    image: payload?.SmallImage?.URL || null,
    title: payload?.Title,
    brand: payload?.Brand,
  };
}
