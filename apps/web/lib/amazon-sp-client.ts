import { env } from "@/env";
import { useTry } from "@/hooks/use-try";
import { IntegrationModel } from "@workspace/mongodb/models/integration";
import { getAmazonSPAccessToken } from "@/services/get-amazon-sp-access-token";
import { createAmazonSPClient } from "@workspace/amazon-sp";

export async function AmazonSPClient(storeId: string) {
  return useTry(async () => {
    const integration = await IntegrationModel.findOne({
      storeId,
      provider: "amazon_sp",
    }).select("+refreshToken");

    if (!integration) {
      throw new Error("Integração Amazon SP não encontrada para esta loja");
    }

    const { access_token } = await getAmazonSPAccessToken(storeId);

    const spClient = createAmazonSPClient(
      integration.refreshToken,
      access_token as string,
      env.SP_API_CLIENT_ID,
      env.SP_API_CLIENT_SECRET
    );

    return spClient;
  });
}
