import type { TopProductDTO } from "./top-products-dto";

export interface DashboardDataResponseDTO {
  stats: {
    totalOrders: number;
    approvedOrders: number;
    totalUnitsQuantity: number;
    financial: {
      totalRevenue: number;
      totalProfit: number;
      profitMargin: number;
      totalNetMarketplace: number;
      ticketAverageNet: number;
      totalAdsCostByProduct: number;
      totalProfitAfterAds: number;
    };
    ads: {
      tacos: number;
      roi: number;
      profitAfterAds: number;
      marginAfterAds: number;
      reportId?: string | null;
      fetchedAt?: string | null;
    };
    products: {
      totalProducts: number;
      topProducts: TopProductDTO[];
      summary: {
        totalQuantitySold: number;
        totalRevenue: number;
        totalProfit: number;
      };
    };
  };
}
