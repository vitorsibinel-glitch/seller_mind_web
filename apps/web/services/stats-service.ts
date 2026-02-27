export function buildProductAdsMap(productMap: Map<string, any>) {
  return productMap;
}

export function calculateAdsMetrics(
  totalRevenue: number,
  totalProfit: number,
  totalAdsCostByProduct: number,
) {
  const profitAfterAds = totalProfit - totalAdsCostByProduct;
  const tacos =
    totalRevenue > 0 ? (totalAdsCostByProduct / totalRevenue) * 100 : 0;

  const totalCost = totalRevenue - totalProfit;
  const roi = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
  const marginAfterAds =
    totalRevenue > 0 ? (profitAfterAds / totalRevenue) * 100 : 0;

  return {
    tacos,
    roi,
    profitAfterAds,
    marginAfterAds,
  };
}

function enrichProductsWithAdsData(
  products: any[],
  productAdsMap: Map<string, any>,
) {
  return products.map((product) => {
    const asin = product.asin;
    const adsData = asin ? productAdsMap.get(asin) : null;

    if (!adsData) {
      return {
        ...product,
        ads: {
          cost: 0,
          clicks: 0,
          impressions: 0,
          conversions: 0,
          sales: 0,
          ctr: 0,
          cpc: 0,
          conversionRate: 0,
          acos: 0,
          roas: 0,
        },
      };
    }

    const profitAfterAds = product.profit - adsData.cost;
    const marginAfterAds =
      product.revenue > 0 ? (profitAfterAds / product.revenue) * 100 : 0;

    return {
      ...product,
      ads: {
        ...adsData,
        profitAfterAds,
        marginAfterAds,
      },
    };
  });
}

export function buildStatsResponse(
  orderData: any,
  adsReportResult: any,
  productAdsMap: Map<string, any>,
) {
  const enrichedProducts = enrichProductsWithAdsData(
    orderData.productsSold,
    productAdsMap,
  );

  const totalAdsCostByProduct = enrichedProducts.reduce(
    (sum: number, p: any) => sum + (p.ads?.cost ?? 0),
    0,
  );

  const totalProfitAfterAds = enrichedProducts.reduce(
    (sum: number, p: any) => sum + (p.ads?.profitAfterAds ?? p.profit),
    0,
  );

  const adsMetrics = calculateAdsMetrics(
    orderData.totalRevenue,
    orderData.totalProfit,
    totalAdsCostByProduct,
  );

  return {
    totalOrders: orderData.totalOrders,
    approvedOrders: orderData.approvedOrders,
    totalUnitsQuantity: orderData.totalUnitsQuantity,
    financial: {
      totalRevenue: orderData.totalRevenue,
      totalProfit: orderData.totalProfit,
      profitMargin: orderData.profitMargin,
      totalNetMarketplace: orderData.totalNetMarketplace,
      ticketAverageNet: orderData.ticketAverageNet,
      totalAdsCostByProduct,
      totalProfitAfterAds,
    },
    ads: {
      ...adsMetrics,
      ...adsReportResult.aggregated,
      reportIds: adsReportResult.reportIds,
      totalReports: adsReportResult.reports.length,
      fetchedAt: adsReportResult.lastFetchedAt,
    },
    products: {
      totalProducts: enrichedProducts.length,
      topProducts: enrichedProducts.slice(0, 10),
      summary: {
        totalQuantitySold: enrichedProducts.reduce(
          (sum: number, p: any) => sum + p.quantitySold,
          0,
        ),
        totalRevenue: enrichedProducts.reduce(
          (sum: number, p: any) => sum + p.revenue,
          0,
        ),
        totalProfit: enrichedProducts.reduce(
          (sum: number, p: any) => sum + p.profit,
          0,
        ),
      },
    },
  };
}
