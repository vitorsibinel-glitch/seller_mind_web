import { env } from "@/env";
import { getRedis } from "@/lib/redis";
import { IntegrationModel } from "@workspace/mongodb/models/integration";
import axios from "axios";

export async function getAmazonAdsAccessToken(storeId: string) {
  const redis = getRedis();
  const redisKey = `amazon_ads:access_token:${storeId}`;
  let token = await redis.get(redisKey);

  if (token) return token;

  token = await refreshAmazonAdsAccessToken(storeId);
  return token;
}

async function refreshAmazonAdsAccessToken(storeId: string) {
  const redis = getRedis();
  const integration = await IntegrationModel.findOne({
    storeId,
    provider: "amazon_ads",
  }).select("+refreshToken");

  if (!integration) throw new Error("Integração não encontrada");

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: integration.refreshToken,
    client_id: env.LWA_CLIENT_ID,
    client_secret: env.LWA_CLIENT_SECRET,
  });

  const res = await axios.post("https://api.amazon.com/auth/o2/token", params);

  const { access_token, expires_in } = res.data;

  await redis.set(
    `amazon_ads:access_token:${storeId}`,
    access_token,
    "EX",
    expires_in || 3600
  );

  return access_token;
}
