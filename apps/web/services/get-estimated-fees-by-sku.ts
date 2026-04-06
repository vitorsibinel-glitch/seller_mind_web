import { useTry } from "@/hooks/use-try";

export async function getEstimatedFeesBySku(
  spClient: any,
  sku: string,
  price: number
) {
  const feesBody = {
    FeesEstimateRequest: {
      MarketplaceId: "A2Q3Y263D00KWC",
      Identifier: `fees-${sku}-${Date.now()}`,
      PriceToEstimateFees: {
        ListingPrice: {
          Amount: price,
          CurrencyCode: "BRL",
        },
        Shipping: {
          Amount: 0,
          CurrencyCode: "BRL",
        },
      },
      IsAmazonFulfilled: true,
    },
  };

  const [feesResponse, feesError] = await useTry(async () =>
    spClient?.callAPI({
      operation: "getMyFeesEstimateForSKU",
      endpoint: "productFees",
      path: { SellerSKU: sku },
      body: feesBody,
    })
  );

  const totalFees =
    feesResponse?.FeesEstimateResult?.FeesEstimate?.TotalFeesEstimate?.Amount ||
    0;

  return { totalFees };
}
