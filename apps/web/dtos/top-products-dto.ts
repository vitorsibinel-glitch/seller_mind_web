export interface TopProductDTO {
  sku: string;
  asin: string | null;
  title: string;
  imageUrl: string | null;
  quantitySold: number;
  revenue: number;
  profit: number;
  orderCount: number;
  profitMargin: number;
  ads?: {
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
    profitAfterAds: number;
    marginAfterAds: number;
    campaignName?: string | null;
    adGroupName?: string | null;
  };
}
