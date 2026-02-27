import { ProductModel } from "@workspace/mongodb/models/product";
import { AmazonSPClient } from "@/lib/amazon-sp-client";
import type {
  CleanOrder,
  ProcessedResultsResponseDTO,
} from "@/dtos/processed-results-response-dto";
import { getEstimatedFeesBySku } from "./get-estimated-fees-by-sku";

const APPROVED_STATUSES = [
  "Shipped",
  "Delivered",
  "Unshipped",
  "PartiallyShipped",
];
const CANCELLED_STATUSES = [
  "Canceled",
  "CANCELLED",
  "SellerCancelled",
  "PendingCancellation",
];

const orderItemsCache = new Map<string, { data: any[]; timestamp: number }>();
const summaryCache = new Map<string, { data: any; timestamp: number }>();

const ORDER_ITEMS_CACHE_TTL = 1000 * 60 * 60 * 24;
const SUMMARY_CACHE_TTL = 1000 * 60 * 15;

function getCacheKey(orderId: string, storeId: string): string {
  return `${storeId}:${orderId}`;
}

function getSummaryCacheKey(
  storeId: string,
  fromDate?: Date | null,
  toDate?: Date | null,
  ordersKey?: string
): string {
  const from = fromDate?.toISOString() || "null";
  const to = toDate?.toISOString() || "null";
  const ordersPart = ordersKey || "null";
  return `summary:${storeId}:${from}:${to}:${ordersPart}`;
}

function getFromCache<T>(
  cache: Map<string, { data: T; timestamp: number }>,
  key: string,
  ttl: number
): T | null {
  const cached = cache.get(key);
  if (!cached) return null;
  const isExpired = Date.now() - cached.timestamp > ttl;
  if (isExpired) {
    cache.delete(key);
    return null;
  }
  return cached.data;
}

function setCache<T>(
  cache: Map<string, { data: T; timestamp: number }>,
  key: string,
  data: T
): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export async function proccessResultsService(
  orders: any[],
  storeId: string,
  fromDate?: Date | null,
  toDate?: Date | null
): Promise<ProcessedResultsResponseDTO> {
  const orderIds = (orders || [])
    .map((o) => o?.AmazonOrderId)
    .filter(Boolean) as string[];
  const ordersKey = orderIds.length > 0 ? orderIds.join(",") : "empty";
  const summaryCacheKey = getSummaryCacheKey(
    storeId,
    fromDate,
    toDate,
    ordersKey
  );
  const cachedSummary = getFromCache(
    summaryCache,
    summaryCacheKey,
    SUMMARY_CACHE_TTL
  );
  if (cachedSummary) return cachedSummary;

  const filtered = (orders || []).filter((o) => {
    if (!o) return false;
    if (!o.PurchaseDate) return false;
    const d = new Date(o.PurchaseDate);
    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;
    return true;
  });

  const ordered = filtered.slice().sort((a: any, b: any) => {
    const da = a.PurchaseDate ? new Date(a.PurchaseDate).getTime() : 0;
    const db = b.PurchaseDate ? new Date(b.PurchaseDate).getTime() : 0;
    return db - da;
  });

  const cleanOrders: CleanOrder[] = ordered.map((order: any) => ({
    amazonOrderId: order.AmazonOrderId,
    purchaseDate: order.PurchaseDate,
    approvalDate: order.LastUpdateDate,
    orderStatus: order.OrderStatus,
  }));

  const result: any = {
    totalRevenue: 0,
    totalProductCost: 0,
    profit: 0,
    grossMargin: 0,
    totalFees: 0,
    netMarketplace: 0,
    ticketAverageNet: 0,
  };

  const skuMap = new Map<string, { sku: string; quantity: number }>();

  const [spClient, spErr] = await AmazonSPClient(storeId);
  if (spErr) {
    throw new Error("Erro ao conectar com Amazon SP API");
  }

  for (const order of ordered) {
    const orderId = order.AmazonOrderId;
    if (!orderId) continue;

    const cacheKey = getCacheKey(orderId, storeId);
    let orderItems = getFromCache(
      orderItemsCache,
      cacheKey,
      ORDER_ITEMS_CACHE_TTL
    );

    if (!orderItems) {
      try {
        const orderItemsResponse = await spClient?.callAPI({
          operation: "orders.getOrderItems",
          path: { orderId },
        });
        orderItems = orderItemsResponse?.OrderItems || [];
        setCache(orderItemsCache, cacheKey, orderItems);
      } catch (error) {
        console.error(`Erro ao buscar itens do pedido ${orderId}:`, error);
        continue;
      }
    }

    for (const item of orderItems!) {
      const sku = item?.SellerSKU ?? item?.SKU ?? null;
      const quantity =
        Number(item?.QuantityOrdered || item?.QuantityShipped) || 0;
      if (!sku) continue;
      const existing = skuMap.get(sku);
      if (existing) existing.quantity += quantity;
      else skuMap.set(sku, { sku, quantity });
    }
  }

  const { totalRevenue, totalCost, totalFees, netMarketplace } =
    await calculateTotals(skuMap, storeId, spClient);

  result.totalRevenue = totalRevenue;
  result.totalProductCost = totalCost;
  result.totalFees = totalFees;
  result.netMarketplace = netMarketplace;
  result.profit = result.totalRevenue - result.totalProductCost - totalFees;
  result.grossMargin =
    result.totalRevenue > 0 ? (result.profit / result.totalRevenue) * 100 : 0;
  result.ticketAverageNet =
    cleanOrders.length > 0 ? netMarketplace / cleanOrders.length : 0;

  const totalProductsSold = Array.from(skuMap.values()).reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const summary = {
    totalOrders: ordered.filter(
      (o: any) => !CANCELLED_STATUSES.includes(o.OrderStatus)
    ).length,
    approvedOrders: ordered.filter((o: any) =>
      APPROVED_STATUSES.includes(o.OrderStatus)
    ).length,
    totalProductsSold,
  };

  const formattedResult = formatOutputFromResult(result, cleanOrders, summary);

  setCache(summaryCache, summaryCacheKey, formattedResult);

  return formattedResult;
}

async function calculateTotals(
  skuMap: Map<string, { sku: string; quantity: number }>,
  storeId: string,
  spClient: any
): Promise<{
  totalRevenue: number;
  totalCost: number;
  totalFees: number;
  netMarketplace: number;
}> {
  if (skuMap.size === 0)
    return { totalRevenue: 0, totalCost: 0, totalFees: 0, netMarketplace: 0 };

  const skus = Array.from(skuMap.keys());

  const products = await ProductModel.find({
    storeId,
    "associations.externalSku": { $in: skus },
  }).lean();

  const productMap = new Map<string, { price: number; cost: number }>();

  for (const product of products) {
    const association = product.associations?.find((a: any) =>
      skus.includes(a.externalSku || "")
    );
    if (association?.externalSku) {
      productMap.set(association.externalSku, {
        price: product.lastKnownPrice?.amount || 0,
        cost: (product.cost || 0) + (product.extraCost || 0),
      });
    }
  }

  let totalRevenue = 0;
  let totalCost = 0;
  let totalFees = 0;
  const missingSkus: string[] = [];

  for (const [externalSku, data] of skuMap) {
    const product = productMap.get(externalSku);
    if (product) {
      try {
        const feesObj = await getEstimatedFeesBySku(
          spClient,
          externalSku,
          product.price
        );
        const feesPerUnit = Number(feesObj?.totalFees || 0);
        totalFees += feesPerUnit * data.quantity;
      } catch (err) {
        console.warn(`Erro ao calcular fees para SKU ${externalSku}:`, err);
      }
      totalRevenue += product.price * data.quantity;
      totalCost += product.cost * data.quantity;
    } else {
      missingSkus.push(externalSku);
    }
  }

  if (missingSkus.length > 0) {
    console.warn(
      `Produtos não encontrados no banco (${missingSkus.length}):`,
      missingSkus.join(", ")
    );
  }

  const netMarketplace = totalRevenue - totalFees;

  return { totalRevenue, totalCost, totalFees, netMarketplace };
}

function formatOutputFromResult(
  result: any,
  cleanOrders: CleanOrder[],
  summary: any
): ProcessedResultsResponseDTO {
  return {
    summary,
    revenue: {
      totalRevenue: result.totalRevenue.toFixed(2),
      netMarketplace: result.netMarketplace.toFixed(2),
      totalFees: result.totalFees.toFixed(2),
      ticketAverageNet: result.ticketAverageNet.toFixed(2),
    },
    costs: { totalProductCost: result.totalProductCost.toFixed(2) },
    profit: {
      profit: result.profit.toFixed(2),
      grossMargin: result.grossMargin.toFixed(2) + "%",
    },
    details: { orderedOrders: cleanOrders },
  };
}
