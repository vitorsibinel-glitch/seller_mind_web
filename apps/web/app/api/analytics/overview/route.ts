import { withDB } from "@/lib/mongoose";
<<<<<<< HEAD
=======
import { requireSubscription } from "@/lib/require-subscription";
>>>>>>> origin/feat/fases-1-4
import { getCompletedAdsReport } from "@/services/ads-report-service";
import { parseDateRange } from "@/services/parse-date-range-service";
import { getOrdersInRange } from "@/services/orders-service";
import {
  buildProductAdsMap,
  buildStatsResponse,
} from "@/services/stats-service";
import { NextResponse } from "next/server";
import { buildCacheKey, withCache } from "@/lib/cache";

export async function GET(req: Request): Promise<NextResponse> {
  return withDB(async () => {
    const url = new URL(req.url);
    const storeId = url.searchParams.get("storeId");
    const period = url.searchParams.get("period");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

<<<<<<< HEAD
    if (!storeId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

=======
    const userId = req.headers.get("x-user-id");
    if (!userId || !storeId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const denied = await requireSubscription(userId);
    if (denied) return denied;

>>>>>>> origin/feat/fases-1-4
    const dateRange = parseDateRange(period, startDate, endDate);
    if (!dateRange) {
      return NextResponse.json({ error: "Data inválida" }, { status: 400 });
    }

    const cacheKey = buildCacheKey(
      "stats",
      storeId,
      period,
      startDate,
      endDate,
    );

    const TTL = 300;

    const stats = await withCache(
      cacheKey,
      async () => {
        const orderData = await getOrdersInRange(storeId, dateRange);

        const adsReportResult = await getCompletedAdsReport(
          storeId,
          dateRange.fromDateUtc,
          dateRange.toDateUtc,
        );

        const productAdsMap = buildProductAdsMap(adsReportResult.productMap);

        return buildStatsResponse(orderData, adsReportResult, productAdsMap);
      },
      { ttl: TTL, prefix: "stats" },
    );

    return NextResponse.json({ stats });
  });
}
