import { OrderModel } from "@workspace/mongodb/models/order";

const EXCLUDED_STATUSES = ["Canceled", "Refunded"];
const APPROVED_STATUSES = ["Shipped", "Delivered"];

interface DateRange {
  fromDateUtc: Date;
  toDateUtc: Date;
}

function aggregateProductsFromOrders(orders: any[]): Map<string, any> {
  const productMap = new Map<string, any>();

  orders.forEach((order) => {
    order.items?.forEach((item: any) => {
      const sku = item.sellerSku || item.asin || "unknown";
      const revenue = (item.itemPrice?.amount || 0) * item.quantity;
      const profit = item.itemProfit || 0;

      if (productMap.has(sku)) {
        const existing = productMap.get(sku);
        existing.quantitySold += item.quantity;
        existing.revenue += revenue;
        existing.profit += profit;
        existing.orderCount += 1;
      } else {
        productMap.set(sku, {
          sku,
          asin: item.asin || null,
          imageUrl: item.productImage,
          title: item.title || "Unknown Product",
          quantitySold: item.quantity,
          revenue,
          profit,
          orderCount: 1,
        });
      }
    });
  });

  return productMap;
}

function buildProductsSoldList(productMap: Map<string, any>): any[] {
  return Array.from(productMap.values())
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .map((product) => ({
      ...product,
      profitMargin:
        product.revenue > 0 ? (product.profit / product.revenue) * 100 : 0,
    }));
}

export async function getOrdersInRange(storeId: string, dateRange: DateRange) {
  const { fromDateUtc, toDateUtc } = dateRange;

  const orders = await OrderModel.find({
    storeId,
    purchaseDate: {
      $gte: fromDateUtc,
      $lte: toDateUtc,
    },
    orderStatus: { $nin: EXCLUDED_STATUSES },
  })
    .select("orderStatus items financialSummary")
    .lean();

  const totalOrders = orders.length;

  const approvedOrders = orders.filter((o) =>
    APPROVED_STATUSES.includes(o.orderStatus || ""),
  );

  const totalUnitsQuantity = orders.reduce((sum, order) => {
    const orderUnits =
      order.items?.reduce(
        (itemSum, item) => itemSum + (item.quantity || 0),
        0,
      ) || 0;

    return sum + orderUnits;
  }, 0);

  const totalRevenue = orders.reduce(
    (sum, o) => sum + (o.financialSummary?.totalRevenue || 0),
    0,
  );

  const totalProfit = orders.reduce(
    (sum, o) => sum + (o.financialSummary?.totalProfit || 0),
    0,
  );

  const totalNetMarketplace = orders.reduce(
    (sum, o) => sum + (o.financialSummary?.netMarketplace || 0),
    0,
  );

  const ticketAverageNet = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const profitMargin =
    totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const productMap = aggregateProductsFromOrders(orders);
  const productsSold = buildProductsSoldList(productMap);

  return {
    totalOrders,
    approvedOrders: approvedOrders.length,
    totalUnitsQuantity,
    totalRevenue,
    totalProfit,
    totalNetMarketplace,
    ticketAverageNet,
    profitMargin,
    productsSold,
  };
}
