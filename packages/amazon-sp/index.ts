import { SellingPartner } from "amazon-sp-api";

export async function createAmazonSPClient(
  refreshToken: string,
  accessToken: string,
  spClientId: string,
  spClientSecret: string
) {
  const spClient = new SellingPartner({
    region: "na",
    refresh_token: refreshToken,
    access_token: accessToken,
    credentials: {
      SELLING_PARTNER_APP_CLIENT_ID: spClientId,
      SELLING_PARTNER_APP_CLIENT_SECRET: spClientSecret,
    },
    options: {
      timeouts: {
        response: 30000, // tempo máximo para receber headers/resposta
        idle: 30000, // tempo máximo de conexão sem tráfego
        deadline: 30000, // tempo máximo total da requisição
      },
    },
  });

  return spClient;
}
