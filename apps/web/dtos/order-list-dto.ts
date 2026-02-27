export interface OrdersResponseDTO {
  data: OrderDTO[];
  stats: OrdersStatsDTO;
}

export interface OrdersStatsDTO {
  totalOrders: number;
  approvedOrders: number;
  totalRevenue: number;
  totalProfit: number;
}

export interface OrderDTO {
  orderId?: string;
  creationDate?: string;
  approvalDate?: string | null;
  totalItems?: number;
  status?: string;
  items?: OrderItemDTO[];

  AmazonOrderId?: string;
  PurchaseDate?: string;
  ApprovalDate?: string | null;
  OrderStatus?: string;
  OrderTotal?: { CurrencyCode?: string; Amount?: string };

  [key: string]: any;
}

export interface OrderItemDTO {
  title?: string;
  sku?: string;
  asin?: string;
  quantity?: number;
  price?: number;
  cost?: number;
  commission?: number;
  tax?: number;
  profit?: number;
  margin?: number;

  // campos cru, caso existam
  QuantityOrdered?: number;
  ItemPrice?: { CurrencyCode?: string; Amount?: string };

  [key: string]: any;
}
