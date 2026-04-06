import { env } from "@/env";
import type { Integration } from "@workspace/mongodb/models/integration";
import { getAmazonAdsAccessToken } from "@/services/get-amazon-ads-access-token";
import { createAmazonADSClient } from "@workspace/amazon-ads";

export async function getAmazonAdsClient(
  storeId: string,
  integration: Integration
) {
  const access_token = await getAmazonAdsAccessToken(storeId);

  const client = createAmazonADSClient(
    env.LWA_CLIENT_ID,
    integration.profileId as string,
    access_token as string
  );

  return client;
}
