import { useTry } from "@/hooks/use-try";
import { AmazonSPClient } from "@/lib/amazon-sp-client";
import { getRedis } from "@/lib/redis";

const redis = getRedis();

export async function GetAmazonOrderDetails(
  storeId: string,
  amazonOrderId: string
) {
  const cacheKey = `amazon:sp:order:${storeId}:${amazonOrderId}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return [JSON.parse(cached), null];
  }

  const [spClient, clientErr] = await AmazonSPClient(storeId);
  if (clientErr) return [null, clientErr];

  const [orderResponse, errOrder] = await useTry(async () =>
    spClient?.callAPI({
      operation: "getOrder",
      endpoint: "orders",
      path: { orderId: amazonOrderId },
    })
  );
  if (errOrder) return [null, errOrder];

  const [itemsResponse, errItems] = await useTry(async () =>
    spClient?.callAPI({
      operation: "getOrderItems",
      endpoint: "orders",
      path: { orderId: amazonOrderId },
    })
  );
  if (errItems) return [null, errItems];

  const details = {
    ...orderResponse,
    items: itemsResponse?.OrderItems ?? [],
  };

  await redis.set(cacheKey, JSON.stringify(details), "EX", 3600 * 24);

  return [details, null];
}
