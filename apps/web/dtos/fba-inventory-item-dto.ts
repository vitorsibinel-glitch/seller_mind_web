export interface FBAInventoryItemDTO {
  _id?: string;
  name: string;
  imageUrl?: string;
  sku: string;
  data: {
    sales: number | null;
    cost: number;
    physicalStock: number;
    inTransitToFBA: number;
    fulfillableQuantity: number;
    unfulfillableQuantity: number;
    reservedQuantity: number;
    daysOfInventory: number | null;
    dailySalesRate: number;
    totalAvailableStock: number;
  };
}

export interface FBAInventoryResponseDTO {
  items: FBAInventoryItemDTO[];
  inventoryDetails: {
    physicalStock: number;
    totalFillable: number;
    inTransitToFBA: number;
    totalStockCost: number;
    expectedSalesValue: number;
    netMarketplaceTotal: number;
    globalDaysOfInventory: number | null;
    globalDailySalesRate: number;
    totalAvailableStock: number;
  };
}
