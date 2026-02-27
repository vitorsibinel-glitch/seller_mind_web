export interface CleanOrder {
  amazonOrderId: string;
  purchaseDate: string;
  approvalDate?: string;
  orderStatus: string;
}

export interface ProcessedResultsResponseDTO {
  summary: {
    totalOrders: number;
    approvedOrders: number;
    totalProductsSold: number;
  };
  revenue: {
    totalRevenue: string;
    netMarketplace: string;
    totalFees: string;
    ticketAverageNet: string;
  };
  costs: {
    totalProductCost: string;
  };
  profit: {
    profit: string;
    grossMargin: string;
  };
  details: {
    orderedOrders: CleanOrder[];
  };
}
