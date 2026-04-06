import { env } from "@/env";
import { getRedis } from "@/lib/redis";

import { IntegrationModel } from "@workspace/mongodb/models/integration";
import axios from "axios";

type AccessTokenResponse = {
  access_token: string | null;
};

const redis = getRedis();

export async function getAmazonSPAccessToken(
  storeId: string
): Promise<AccessTokenResponse> {
  const redisKey = `amazon_sp:access_token:${storeId}`;
  let accessToken = await redis.get(redisKey);

  if (accessToken) return { access_token: accessToken };

  accessToken = await refreshAmazonSPAccessToken(storeId);
  return { access_token: accessToken };
}

async function refreshAmazonSPAccessToken(storeId: string) {
  const integration = await IntegrationModel.findOne({
    storeId,
    provider: "amazon_sp",
  }).select("+refreshToken");

  if (!integration) throw new Error("Integração não encontrada");

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: integration.refreshToken,
    client_id: env.SP_API_CLIENT_ID,
    client_secret: env.SP_API_CLIENT_SECRET,
  });

  const res = await axios.post("https://api.amazon.com/auth/o2/token", params);

  const { access_token, expires_in } = res.data;

  await redis.set(
    `amazon_sp:access_token:${storeId}`,
    access_token,
    "EX",
    expires_in || 3600
  );

  return access_token;
}
