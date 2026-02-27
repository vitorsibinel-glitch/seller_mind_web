import { AdsReportModel } from "@workspace/mongodb/models/ads-report";
import { format } from "date-fns";

interface LeanAdsReport {
  _id: any;
  storeId: string;
  reportId: string;
  date: string;
  status: string;
  data?: any;
  error?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface AggregatedAdsData {
  cost: number;
  clicks: number;
  impressions: number;
  conversions: number;
  sales: number;
  ctr: number;
  cpc: number;
  conversionRate: number;
  acos: number;
  roas: number;
}

interface AdsReportResult {
  aggregated: AggregatedAdsData;
  productMap: Map<string, any>;
  reports: LeanAdsReport[];
  reportIds: string[];
  lastFetchedAt: Date | null;
}

function formatDateToString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function aggregateReportsData(reports: LeanAdsReport[]): AggregatedAdsData {
  const totals = {
    cost: 0,
    clicks: 0,
    impressions: 0,
    conversions: 0,
    sales: 0,
  };

  for (const report of reports) {
    const agg = report.data?.aggregated;
    if (!agg) continue;

    totals.cost += agg.cost ?? 0;
    totals.clicks += agg.clicks ?? 0;
    totals.impressions += agg.impressions ?? 0;
    totals.conversions += agg.conversions ?? 0;
    totals.sales += agg.sales ?? 0;
  }

  const ctr =
    totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;

  const cpc = totals.clicks > 0 ? totals.cost / totals.clicks : 0;

  const conversionRate =
    totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;

  const acos = totals.sales > 0 ? (totals.cost / totals.sales) * 100 : 0;

  const roas = totals.cost > 0 ? totals.sales / totals.cost : 0;

  return {
    ...totals,
    ctr,
    cpc,
    conversionRate,
    acos,
    roas,
  };
}

function aggregateProductsData(reports: LeanAdsReport[]): Map<string, any> {
  const productMap = new Map<string, any>();

  for (const report of reports) {
    const products = report.data?.products;
    if (!products) continue;

    for (const product of products) {
      const asin = product.asin;
      if (!asin) continue;

      const existing = productMap.get(asin);

      if (existing) {
        existing.cost += product.cost ?? 0;
        existing.clicks += product.clicks ?? 0;
        existing.impressions += product.impressions ?? 0;
        existing.conversions += product.conversions ?? 0;
        existing.sales += product.sales ?? 0;
      } else {
        productMap.set(asin, {
          asin,
          cost: product.cost ?? 0,
          clicks: product.clicks ?? 0,
          impressions: product.impressions ?? 0,
          conversions: product.conversions ?? 0,
          sales: product.sales ?? 0,
          campaignName: product.campaignName ?? null,
          adGroupName: product.adGroupName ?? null,
        });
      }
    }
  }

  for (const [asin, data] of productMap) {
    data.ctr =
      data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0;

    data.cpc = data.clicks > 0 ? data.cost / data.clicks : 0;

    data.conversionRate =
      data.clicks > 0 ? (data.conversions / data.clicks) * 100 : 0;

    data.acos = data.sales > 0 ? (data.cost / data.sales) * 100 : 0;

    data.roas = data.cost > 0 ? data.sales / data.cost : 0;
  }

  return productMap;
}

export async function getCompletedAdsReport(
  storeId: string,
  startDate: Date,
  endDate: Date,
): Promise<AdsReportResult> {
  const startDateStr = formatDateToString(startDate);
  const endDateStr = formatDateToString(endDate);

  const reports = await AdsReportModel.find({
    storeId,
    status: "COMPLETED",
    date: {
      $gte: startDateStr,
      $lte: endDateStr,
    },
  })
    .sort({ date: -1 })
    .lean<LeanAdsReport[]>();

  const aggregated = aggregateReportsData(reports);
  const productMap = aggregateProductsData(reports);

  const reportIds = reports.map((r) => r.reportId);
  const lastFetchedAt =
    reports[0]?.data?.fetchedAt ?? reports[0]?.updatedAt ?? null;

  return {
    aggregated,
    productMap,
    reports,
    reportIds,
    lastFetchedAt,
  };
}
