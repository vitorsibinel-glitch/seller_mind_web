// import { useTry } from "@/hooks/use-try";
// import { AmazonSPClient } from "@/lib/amazon-sp-client";
// import { withDB } from "@/lib/mongoose";
// import { IntegrationModel } from "@workspace/mongodb/models/integration";
// import { ProductModel } from "@workspace/mongodb/models/product";
// import { NextResponse } from "next/server";

// const feesCache = new Map<string, { data: any; timestamp: number }>();
// const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 horas

// interface OrderItem {
//   ASIN: string;
//   SellerSKU: string;
//   QuantityOrdered: number;
//   ItemPrice?: { Amount: string };
// }

// function getCacheKey(
//   asin: string,
//   sku: string,
//   storeId: string,
//   orderId: string
// ): string {
//   return `${storeId}:${asin}:${sku}:${orderId}`;
// }

// function getFromCache(key: string): any | null {
//   const cached = feesCache.get(key);
//   if (!cached) return null;

//   const isExpired = Date.now() - cached.timestamp > CACHE_TTL;
//   if (isExpired) {
//     feesCache.delete(key);
//     return null;
//   }

//   return cached.data;
// }

// function setCache(key: string, data: any): void {
//   feesCache.set(key, { data, timestamp: Date.now() });
// }

// export async function GET(
//   req: Request,
//   { params }: { params: Promise<{ orderId: string }> }
// ) {
//   return withDB(async () => {
//     const url = new URL(req.url);
//     const storeId = url.searchParams.get("storeId");
//     const { orderId } = await params;

//     if (!storeId || !orderId) {
//       return NextResponse.json(
//         { error: "storeId e orderId são obrigatórios" },
//         { status: 400 }
//       );
//     }

//     const [spClient, clientError] = await AmazonSPClient(storeId);
//     if (clientError) {
//       return NextResponse.json(
//         { error: "Erro ao inicializar SP Client" },
//         { status: 500 }
//       );
//     }

//     const [orderItemsResponse, orderItemsError] = await useTry(async () =>
//       spClient?.callAPI({
//         operation: "getOrderItems",
//         endpoint: "orders",
//         path: { orderId },
//       })
//     );

//     if (orderItemsError || !orderItemsResponse) {
//       return NextResponse.json(
//         { error: "Erro ao buscar order items", details: orderItemsError },
//         { status: 500 }
//       );
//     }

//     const orderItems: OrderItem[] = orderItemsResponse?.OrderItems || [];
//     const results = [];

//     for (const item of orderItems) {
//       const { ASIN, SellerSKU, QuantityOrdered } = item;
//       const cacheKey = getCacheKey(ASIN, SellerSKU, storeId, orderId);

//       let cachedData = getFromCache(cacheKey);

//       if (cachedData) {
//         results.push({
//           ...cachedData,
//           quantity: QuantityOrdered,
//           fromCache: true,
//         });
//         continue;
//       }

//       const product = await ProductModel.findOne({
//         $or: [{ asin: ASIN }, { sku: SellerSKU }],
//         storeId,
//       });

//       const integration = await IntegrationModel.findOne({
//         storeId,
//         provider: "amazon_sp",
//       });

//       const productName = product?.name;
//       const image = product?.imageUrl;

//       let listPrice = Number(item.ItemPrice?.Amount);

//       if (!Number.isFinite(listPrice)) {
//         const response = await spClient?.callAPI({
//           operation: "listingsItems.getListingsItem",
//           path: {
//             sellerId: integration?.sellerId,
//             sku: SellerSKU,
//           },
//           query: {
//             marketplaceIds: ["A2Q3Y263D00KWC"],
//             includedData: ["offers"],
//           },
//         });

//         listPrice = Number(response.offers[0].price.amount);
//       }

//       const feesBody = {
//         FeesEstimateRequest: {
//           MarketplaceId: "A2Q3Y263D00KWC",
//           Identifier: `fees-${ASIN}-${Date.now()}`,
//           PriceToEstimateFees: {
//             ListingPrice: {
//               Amount: listPrice,
//               CurrencyCode: "BRL",
//             },
//             Shipping: {
//               Amount: 0,
//               CurrencyCode: "BRL",
//             },
//           },
//           IsAmazonFulfilled: true,
//         },
//       };

//       const [feesResponse, feesError] = await useTry(async () =>
//         spClient?.callAPI({
//           operation: "getMyFeesEstimateForASIN",
//           endpoint: "productFees",
//           path: { Asin: ASIN },
//           body: feesBody,
//         })
//       );

//       const totalFees =
//         feesResponse?.FeesEstimateResult?.FeesEstimate?.TotalFeesEstimate
//           ?.Amount || 0;

//       const productCost = product?.cost || 0;

//       const taxRate = 0.04; // 4%
//       const taxAmount = listPrice * taxRate;
//       const netRevenue = listPrice - totalFees - taxAmount;
//       const profit = netRevenue - productCost;
//       const profitMargin = listPrice > 0 ? (profit / listPrice) * 100 : 0;

//       const itemData = {
//         asin: ASIN,
//         sku: SellerSKU,
//         name: productName,
//         image,
//         pricing: {
//           listPrice,
//           totalFees,
//           taxAmount,
//           taxRate: taxRate * 100,
//           netRevenue,
//         },
//         costs: {
//           productCost,
//         },
//         profitability: {
//           profit,
//           profitMargin: Number(profitMargin.toFixed(2)),
//         },
//         quantity: QuantityOrdered,
//         totalProfit: profit * QuantityOrdered,
//       };

//       setCache(cacheKey, itemData);

//       results.push({
//         ...itemData,
//         fromCache: false,
//       });
//     }

//     const summary = {
//       totalItems: results.length,
//       totalQuantity: results.reduce((sum, item) => sum + item.quantity, 0),
//       totalRevenue: results.reduce(
//         (sum, item) => sum + item.pricing.listPrice * item.quantity,
//         0
//       ),
//       totalFees: results.reduce(
//         (sum, item) => sum + item.pricing.totalFees * item.quantity,
//         0
//       ),
//       totalTaxes: results.reduce(
//         (sum, item) => sum + item.pricing.taxAmount * item.quantity,
//         0
//       ),
//       totalCosts: results.reduce(
//         (sum, item) => sum + item.costs.productCost * item.quantity,
//         0
//       ),
//       totalProfit: results.reduce((sum, item) => sum + item.totalProfit, 0),
//     };

//     return NextResponse.json({
//       success: true,
//       orderId,
//       storeId,
//       items: results,
//       summary,
//     });
//   });
// }
