import { ProductModel } from "@workspace/mongodb/models/product";
import { OrderModel } from "@workspace/mongodb/models/order";
import { getFBAInventory } from "@/services/get-fba-inventory";
import type { FBAInventoryItemDTO } from "@/dtos/fba-inventory-item-dto";

const MARKETPLACE_FEE = 0.15;

type FBAInventoryItem = {
  sellerSku?: string;
  fnSku?: string;
  asin?: string;
  productName?: string;
  lastUpdatedTime?: string;
  inventoryDetails?: {
    fulfillableQuantity?: number;
    reservedQuantity?: { totalReservedQuantity?: number };
    unfulfillableQuantity?: { totalUnfulfillableQuantity?: number };
  };
};

type SalesData = {
  sku: string;
  confirmedUnits: number;
  pendingUnits: number;
  firstOrderDate: Date | null;
};

async function getSalesData(
  storeId: string,
  days = 30,
): Promise<Map<string, SalesData>> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const confirmedStatuses = [
    "Unshipped",
    "PartiallyShipped",
    "Shipped",
    "Delivered",
  ];
  const pendingStatuses = ["Pending"];
  const includedStatuses = [...confirmedStatuses, ...pendingStatuses];

  const orders = await OrderModel.find({
    storeId,
    purchaseDate: { $gte: startDate },
    orderStatus: { $in: includedStatuses },
  })
    .select("items orderStatus purchaseDate")
    .sort({ purchaseDate: 1 })
    .lean();

  const firstOrderDates = await OrderModel.aggregate([
    {
      $match: {
        storeId,
        orderStatus: { $in: includedStatuses },
        purchaseDate: { $exists: true },
      },
    },
    { $unwind: "$items" },
    {
      $group: {
        _id: { $ifNull: ["$items.sellerSku", "$items.asin"] },
        firstOrderDate: { $min: "$purchaseDate" },
      },
    },
  ]);

  const firstOrderMap = new Map<string, Date>();
  firstOrderDates.forEach((it: any) => {
    if (it._id) firstOrderMap.set(it._id, new Date(it.firstOrderDate));
  });

  const salesMap = new Map<string, SalesData>();

  orders.forEach((order: any) => {
    const isConfirmed = confirmedStatuses.includes(order.orderStatus || "");
    const isPending = pendingStatuses.includes(order.orderStatus || "");

    order.items?.forEach((item: any) => {
      const sku = item.sellerSku || item.asin;
      if (!sku) return;
      const quantity = item.quantity || 0;

      if (!salesMap.has(sku)) {
        salesMap.set(sku, {
          sku,
          confirmedUnits: 0,
          pendingUnits: 0,
          firstOrderDate: firstOrderMap.get(sku) || null,
        });
      }
      const sd = salesMap.get(sku)!;
      if (isConfirmed) sd.confirmedUnits += quantity;
      else if (isPending) sd.pendingUnits += quantity;
    });
  });

  return salesMap;
}

function calculateDailySalesRate(
  salesData: SalesData,
  analysisPeriod: number = 30,
) {
  const { confirmedUnits, pendingUnits, firstOrderDate } = salesData;
  let activeDays = analysisPeriod;

  if (firstOrderDate) {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - firstOrderDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    activeDays = Math.max(1, Math.min(diffDays, analysisPeriod));
  }

  const weightedTotal = confirmedUnits * 1.0 + pendingUnits * 0.85;
  const dailySalesRate = weightedTotal / activeDays;

  return { dailySalesRate, activeDays };
}

export async function getInventoryHealth(storeId: string, analysisPeriod = 30) {
  if (!storeId) throw new Error("storeId is required");

  const [summaries, err] = await getFBAInventory(storeId);
  if (err) {
    const message = (err as Error).message || "Erro ao buscar inventário FBA";
    const isMarketplaceError =
      message.toLowerCase().includes("marketplace") ||
      message.toLowerCase().includes("integration");

    const code = isMarketplaceError ? "NO_MARKETPLACE" : "FETCH_ERROR";
    const status = isMarketplaceError ? 404 : 500;

    return { error: true, message, code, status };
  }

  const products = await ProductModel.find({ storeId }).lean();

  if (!products || products.length === 0) {
    return {
      error: true,
      message: "Adicione produtos internos para visualizar seu inventário FBA",
      status: 404,
    };
  }

  const salesMap = await getSalesData(storeId, analysisPeriod);

  const productMap = new Map<string, (typeof products)[0]>();
  products.forEach((p) => {
    productMap.set(p.sku, p);
    p.associations?.forEach((assoc: any) => {
      if (assoc.externalSku) productMap.set(assoc.externalSku, p);
      if (assoc.externalProductId) productMap.set(assoc.externalProductId, p);
    });
  });

  const aggregatedData = new Map<
    string,
    { product: (typeof products)[0]; fbaItems: FBAInventoryItem[] }
  >();
  (summaries || []).forEach((item: FBAInventoryItem) => {
    const identifiers = [item.sellerSku, item.fnSku, item.asin].filter(Boolean);
    let matchedProduct = null;
    for (const id of identifiers) {
      if (id && productMap.has(id)) {
        matchedProduct = productMap.get(id);
        break;
      }
    }
    if (matchedProduct) {
      const key = matchedProduct.sku;
      if (!aggregatedData.has(key))
        aggregatedData.set(key, { product: matchedProduct, fbaItems: [] });
      aggregatedData.get(key)!.fbaItems.push(item);
    }
  });

  let globalTotalFillable = 0;
  let globalTotalStockCost = 0;
  let globalExpectedSalesValue = 0;
  let globalTotalFBAStock = 0;
  let globalConfirmedUnits = 0;
  let globalPendingUnits = 0;
  let globalDailySalesRate = 0;
  let globalDaysOfInventorySum = 0;

  const totalInTransitToFBA = products.reduce(
    (acc, product) => acc + (product.stock?.inTransitToFBA ?? 0),
    0,
  );
  const physicalStock = products.reduce(
    (acc, product) => acc + (product.stock?.localQuantity ?? 0),
    0,
  );

  const items: FBAInventoryItemDTO[] = Array.from(aggregatedData.values())
    .map(({ product, fbaItems }) => {
      let totalFulfillable = 0;
      let totalReserved = 0;
      let totalUnfulfillable = 0;

      fbaItems.forEach((it) => {
        const inv = it.inventoryDetails ?? {};
        totalFulfillable += Number(inv.fulfillableQuantity ?? 0);
        totalReserved += Number(
          inv.reservedQuantity?.totalReservedQuantity ?? 0,
        );
        totalUnfulfillable += Number(
          inv.unfulfillableQuantity?.totalUnfulfillableQuantity ?? 0,
        );
      });

      const unitCost = (product.cost ?? 0) + (product.extraCost ?? 0);
      const saleAssoc = product.associations?.find((a: any) => a.salePrice);
      const salePrice = saleAssoc?.salePrice ?? 0;

      const totalCost = totalFulfillable * unitCost;
      const totalSalesValue = totalFulfillable * salePrice;

      globalTotalFillable += totalFulfillable;
      globalTotalStockCost += totalCost;
      globalExpectedSalesValue += totalSalesValue;

      const localQty = product.stock?.localQuantity ?? 0;
      const transitQty = product.stock?.inTransitToFBA ?? 0;
      const fbaStock = totalFulfillable;

      const salesData = salesMap.get(product.sku);
      let dailySalesRate = 0;
      let daysOfInventory: number | null = null;
      let activeDays = analysisPeriod;

      if (salesData) {
        const calculation = calculateDailySalesRate(salesData, analysisPeriod);
        dailySalesRate = calculation.dailySalesRate;
        activeDays = calculation.activeDays;

        globalConfirmedUnits += salesData.confirmedUnits;
        globalPendingUnits += salesData.pendingUnits;
        globalDailySalesRate += dailySalesRate;

        if (dailySalesRate > 0) {
          daysOfInventory = fbaStock / dailySalesRate;
        }

        if (daysOfInventory !== null && Number.isFinite(daysOfInventory)) {
          globalDaysOfInventorySum += daysOfInventory;
        }
      }

      globalTotalFBAStock += fbaStock;

      const dto: FBAInventoryItemDTO = {
        name: product.name,
        imageUrl: product.imageUrl,
        sku: product.sku,
        data: {
          sales: totalSalesValue || null,
          cost: totalCost,
          physicalStock: localQty,
          inTransitToFBA: transitQty,
          fulfillableQuantity: totalFulfillable,
          unfulfillableQuantity: totalUnfulfillable,
          reservedQuantity: totalReserved,
          daysOfInventory:
            daysOfInventory !== null ? Math.round(daysOfInventory) : null,
          dailySalesRate: Number(dailySalesRate.toFixed(2)),
          totalAvailableStock: fbaStock,
        },
      };

      return dto;
    })
    .sort((a, b) => (b.data.sales ?? 0) - (a.data.sales ?? 0));

  const globalNetMarketplaceTotal =
    globalExpectedSalesValue * (1 - MARKETPLACE_FEE);
  const globalDaysOfInventory =
    globalDaysOfInventorySum > 0 ? Math.round(globalDaysOfInventorySum) : null;

  return {
    error: false,
    items,
    inventoryDetails: {
      physicalStock,
      totalFillable: globalTotalFillable,
      inTransitToFBA: totalInTransitToFBA,
      totalStockCost: globalTotalStockCost,
      expectedSalesValue: globalExpectedSalesValue,
      netMarketplaceTotal: globalNetMarketplaceTotal,
      globalDaysOfInventory,
      globalDailySalesRate: Number(globalDailySalesRate.toFixed(2)),
      totalAvailableStock: globalTotalFBAStock,
      analysisPeriod,
      globalConfirmedUnits,
      globalPendingUnits,
    },
  };
}
