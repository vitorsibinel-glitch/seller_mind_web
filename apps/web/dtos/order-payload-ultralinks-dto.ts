export type OrderPayloadUltraLinksDTO = {
  storeId: string;
  addressId: string;
  item: any;
  note: string;
  payment: {
    provider: "1";
    method: PAYMENT_METHOD;
    creditCard?: {
      id: string;
      holder: string;
      document: string;
    };
  };
  metadata: {};
};

export enum PAYMENT_METHOD {
  CREDIT_CARD = "credit_card",
  PIX = "pix",
}

export const PAYMENT_METHOD_LABELS: Record<PAYMENT_METHOD, string> = {
  [PAYMENT_METHOD.CREDIT_CARD]: "Cartão de Crédito",
  [PAYMENT_METHOD.PIX]: "Pix",
};
