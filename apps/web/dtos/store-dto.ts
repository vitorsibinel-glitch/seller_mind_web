import type { IntegrationDTO } from "./integration-dto";

export interface StoreDTO {
  _id: string;
  name: string;
  logoUrl?: string | null;
  taxRate: number;
  integrations: IntegrationDTO[];
  userId: string;
}

export interface StoresResponseDTO {
  stores: StoreDTO[];
}
