export interface IntegrationDTO {
  status?: "Conectado" | "Conectando..." | "Desconectado";
  lastSync?: string | null;
  provider?: "amazon_ads" | "amazon_sp";
  refreshToken: string;
  accountName: string;
  profileId: string;
  sellerId: string;
}
