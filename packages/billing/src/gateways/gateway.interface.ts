export interface CreateCustomerParams {
  name: string;
  email: string;
  cpfCnpj?: string;
  phone?: string;
}

export interface CreateCustomerResult {
  gatewayCustomerId: string;
}

export interface CreateSubscriptionParams {
  gatewayCustomerId: string;
  /** Valor em BRL, lido do Plan.prices no Mongo */
  value: number;
  /** "CREDIT_CARD" | "PIX" */
  billingType: "CREDIT_CARD" | "PIX";
  /** "MONTHLY" | "YEARLY" */
  cycle: "MONTHLY" | "YEARLY";
  description: string;
}

export interface CreateSubscriptionResult {
  gatewaySubscriptionId: string;
  /** URL para redirecionar o usuário para pagar */
  checkoutUrl: string;
}

export interface GatewayCancelParams {
  gatewaySubscriptionId: string;
}

export interface IBillingGateway {
  createCustomer(params: CreateCustomerParams): Promise<CreateCustomerResult>;
  createSubscription(
    params: CreateSubscriptionParams,
  ): Promise<CreateSubscriptionResult>;
  cancelSubscription(params: GatewayCancelParams): Promise<void>;
}
