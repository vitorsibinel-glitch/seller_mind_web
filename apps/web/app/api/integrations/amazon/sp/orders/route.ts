import { withDB } from "@/lib/mongoose";
import { OrderModel } from "@workspace/mongodb/models/order";
import { NextResponse } from "next/server";
import { formatInTimeZone } from "@/utils/format-in-timezone";
import { validateStoreFromRequest } from "@/lib/validate-store-from-request";
import { parseDateRange } from "@/services/parse-date-range-service";
import { buildCacheKey, withCache } from "@/lib/cache";

export async function GET(req: Request): Promise<NextResponse> {
  return withDB(async () => {
    const { store } = await validateStoreFromRequest(req);

    const url = new URL(req.url);
    const period = url.searchParams.get("period");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "15");
    const nextToken = url.searchParams.get("nextToken");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const sku = url.searchParams.get("sku");
    const orderId = url.searchParams.get("orderId");
    const orderStatus = url.searchParams.get("orderStatus");

    const dateRange = parseDateRange(period, startDate, endDate);
    if (!dateRange) {
      return NextResponse.json({ error: "Data inválida" }, { status: 400 });
    }

    const skip = nextToken
      ? parseInt(Buffer.from(nextToken, "base64").toString())
      : 0;

    const cacheKey = buildCacheKey(
      "orders",
      store._id.toString(),
      period,
      startDate,
      endDate,
      sku,
      orderId,
      orderStatus,
      skip.toString(),
      pageSize.toString(),
    );

    const result = await withCache(
      cacheKey,
      async () => {
        const baseQuery: any = {
          storeId: store._id,
          purchaseDate: {
            $gte: dateRange.fromDateUtc,
            $lte: dateRange.toDateUtc,
          },
        };

        if (sku) {
          baseQuery["items.sellerSku"] = { $regex: sku.trim(), $options: "i" };
        }

        if (orderId) {
          baseQuery.amazonOrderId = { $regex: orderId.trim(), $options: "i" };
        }

        if (orderStatus) {
          baseQuery.orderStatus = orderStatus;
        }

        const [orders, totalCount] = await Promise.all([
          OrderModel.find(baseQuery)
            .sort({ purchaseDate: -1 })
            .skip(skip)
            .limit(pageSize)
            .lean(),
          OrderModel.countDocuments(baseQuery),
        ]);

        const hasMore = skip + pageSize < totalCount;
        const newNextToken = hasMore
          ? Buffer.from((skip + pageSize).toString()).toString("base64")
          : null;

        let stats = null;
        if (skip === 0) {
          const allOrders = await OrderModel.find(baseQuery)
            .select("orderStatus financialSummary")
            .lean();

          const nonCanceledOrders = allOrders.filter(
            (o) => o.orderStatus !== "Canceled",
          );

          const approvedStatuses = ["Shipped", "Delivered"];
          const approvedOrders = nonCanceledOrders.filter((o) =>
            approvedStatuses.includes(o.orderStatus || ""),
          );

          const totalRevenue = nonCanceledOrders.reduce(
            (sum, o) => sum + (o.financialSummary?.totalRevenue || 0),
            0,
          );
          const totalProfit = nonCanceledOrders.reduce(
            (sum, o) => sum + (o.financialSummary?.totalProfit || 0),
            0,
          );

          stats = {
            totalOrders: nonCanceledOrders.length,
            approvedOrders: approvedOrders.length,
            financial: {
              totalRevenue,
              totalProfit,
            },
          };
        }

        const cleanOrders = orders.map((order) => ({
          amazonOrderId: order.amazonOrderId,
          purchaseDate: order.purchaseDate
            ? formatInTimeZone(order.purchaseDate, "America/Sao_Paulo")
            : null,
          approvalDate: order.approvalDate
            ? formatInTimeZone(order.approvalDate, "America/Sao_Paulo")
            : null,
          orderDate: order.orderDate,
          shippedAt: order.shippedAt,
          deliveredAt: order.deliveredAt,
          orderStatus: order.orderStatus,
          items: order.items,
          financialSummary: order.financialSummary,
        }));

        return {
          data: cleanOrders,
          nextToken: newNextToken,
          stats,
        };
      },
      { ttl: 300, prefix: "orders" },
    );

    return NextResponse.json(result);
  });
}
