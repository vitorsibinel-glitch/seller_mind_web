import { useTry } from "@/hooks/use-try";
import { AmazonSPClient } from "@/lib/amazon-sp-client";
import { getRedis } from "@/lib/redis";

const redis = getRedis();

export async function getAmazonOrders(
  storeId: string,
  options?: {
    nextToken?: string;
    pageSize?: number;
    createdAfter?: string;
    useCache?: boolean;
  }
) {
  const pageSize = options?.pageSize ?? 50;
  const useCache = options?.useCache ?? true;

  const CACHE_TTL_SECONDS = 1000 * 60 * 15; // 15 minutos

  const cacheKey = options?.nextToken
    ? `amazon:sp:orders:${storeId}:token:${options.nextToken}`
    : `amazon:sp:orders:${storeId}:first:after:${options?.createdAfter}:ps:${pageSize}`;

  // if (useCache) {
  //   const cached = await redis.get(cacheKey);

  //   if (cached) {
  //     try {
  //       return [JSON.parse(cached), null] as const;
  //     } catch (e) {
  //       console.warn("amazon:sp cache parse error", e);
  //     }
  //   }
  // }

  const [spClient, clientErr] = await AmazonSPClient(storeId);
  if (clientErr) return [null, clientErr] as const;
  if (!spClient) return [null, new Error("SP client not available")] as const;

  const query: any = options?.nextToken
    ? { NextToken: options.nextToken }
    : {
        MarketplaceIds: ["A2Q3Y263D00KWC"],
        CreatedAfter:
          options?.createdAfter ??
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // ultimos 7 dias
        MaxResultsPerPage: pageSize,
      };

  const [ordersResponse, errOrders] = await useTry(async () =>
    spClient.callAPI({
      operation: "getOrders",
      endpoint: "orders",
      query,
    })
  );

  if (errOrders) {
    return [null, errOrders] as const;
  }

  let ordersRaw: any = ordersResponse;

  const result = {
    Orders: ordersRaw.Orders || [],
    NextToken: ordersRaw.NextToken || null,
    Raw: ordersRaw,
  };

  if (useCache) {
    try {
      await redis.set(
        cacheKey,
        JSON.stringify(result),
        "EX",
        CACHE_TTL_SECONDS
      );
    } catch (e) {
      console.warn("Erro ao setar cache amazon orders:", e);
    }
  }

  return [result, null] as const;
}
