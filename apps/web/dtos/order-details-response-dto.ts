export interface OrderDetailsResponseDTO {
  success: boolean;
  orderId: string;
  storeId: string;
  items: OrderItem[];
  summary: OrderSummary;
}

export interface OrderItem {
  asin: string;
  sku: string;
  name: string;
  image: string;
  pricing: {
    listPrice: number;
    totalFees: number;
    taxAmount: number;
    taxRate: number;
    netRevenue: number;
  };
  costs: {
    productCost: number;
  };
  profitability: {
    profit: number;
    profitMargin: number;
  };
  quantity: number;
  totalProfit: number;
  fromCache: boolean;
}

export interface OrderSummary {
  totalItems: number;
  totalQuantity: number;
  totalRevenue: number;
  totalFees: number;
  totalTaxes: number;
  totalCosts: number;
  totalProfit: number;
}
