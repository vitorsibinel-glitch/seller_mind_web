import { AmazonSPClient } from "@/lib/amazon-sp-client";
// fazer o cache desses dados
export async function getFBAInventory(storeId: string) {
  const [spClient, clientErr] = await AmazonSPClient(storeId);
  if (clientErr) return [null, clientErr];

  const BR_MARKETPLACE_ID = "A2Q3Y263D00KWC";

  const query: any = {
    details: true,
    marketplaceIds: BR_MARKETPLACE_ID,
    granularityType: "Marketplace",
    granularityId: BR_MARKETPLACE_ID,
  };

  const resp: any = await spClient?.callAPI({
    operation: "getInventorySummaries",
    endpoint: "fbaInventory",
    query,
  });

  const summaries = resp.inventorySummaries;

  return [summaries, null];
}
