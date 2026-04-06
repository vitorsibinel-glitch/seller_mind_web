import { useTry } from "@/hooks/use-try";
import { AmazonSPClient } from "@/lib/amazon-sp-client";
import { getRedis } from "@/lib/redis";

export async function SearchAmazonListingItems(
  storeId: string,
  sellerId: string
) {
  const redis = getRedis();
  const [spClient, error] = await AmazonSPClient(storeId);
  if (error) throw new Error("Erro ao inicializar SP Client");

  const cacheKey = `search:listing:items:${sellerId}`;

  const cachedData = await redis.get(cacheKey);
  if (cachedData) {
    const items = JSON.parse(cachedData);
    return [items, null];
  }

  const [response, err] = await useTry(async () => {
    return await spClient?.callAPI({
      operation: "listingsItems.searchListingsItems",
      path: {
        sellerId,
      },
      query: {
        marketplaceIds: ["A2Q3Y263D00KWC"],
        includedData: ["summaries", "offers"],
      },
    });
  });

  if (err) {
    return [null, err];
  }

  const items = response?.items ?? [];

  const CACHE_TTL_SECONDS = 15 * 60; // 15 minutos;
  await redis.set(cacheKey, JSON.stringify(items), "EX", CACHE_TTL_SECONDS);

  return [items, null];
}
