import axios from "axios";

export async function createAmazonADSClient(
  lwaClientId: string,
  profileId: string,
  accessToken: string
) {
  return axios.create({
    baseURL: "https://advertising-api.amazon.com",
    headers: {
      "Amazon-Advertising-API-ClientId": lwaClientId,
      "Amazon-Advertising-API-Scope": profileId,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
}
