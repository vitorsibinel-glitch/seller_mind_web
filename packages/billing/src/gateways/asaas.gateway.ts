import type {
  IBillingGateway,
  CreateCustomerParams,
  CreateCustomerResult,
  CreateSubscriptionParams,
  CreateSubscriptionResult,
  GatewayCancelParams,
} from "./gateway.interface";

const ASAAS_BASE_URL = "https://api.asaas.com/v3";

/**
 * Cria uma instância do gateway Asaas.
 * apiKey vem de env.ASAAS_API_KEY — nunca hardcoded aqui.
 */
export function createAsaasGateway(apiKey: string): IBillingGateway {
  async function request<T>(
    method: "GET" | "POST" | "DELETE",
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        access_token: apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Asaas ${method} ${path} → ${res.status}: ${text}`);
    }

    return res.json() as Promise<T>;
  }

  return {
    async createCustomer(
      params: CreateCustomerParams,
    ): Promise<CreateCustomerResult> {
      const data = await request<{ id: string }>("POST", "/customers", {
        name: params.name,
        email: params.email,
        ...(params.cpfCnpj ? { cpfCnpj: params.cpfCnpj } : {}),
        ...(params.phone ? { phone: params.phone } : {}),
      });

      return { gatewayCustomerId: data.id };
    },

    async createSubscription(
      params: CreateSubscriptionParams,
    ): Promise<CreateSubscriptionResult> {
      // Asaas cobra com nextDueDate = hoje: primeira cobrança imediata.
      // O trial é controlado pelo Mongo, não pelo Asaas.
      const nextDueDate = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

      const data = await request<{
        id: string;
        invoiceUrl?: string;
        bankSlipUrl?: string;
        paymentLink?: string;
      }>("POST", "/subscriptions", {
        customer: params.gatewayCustomerId,
        billingType: params.billingType,
        value: params.value,
        nextDueDate,
        cycle: params.cycle,
        description: params.description,
      });

      // Asaas retorna diferentes campos dependendo do método de pagamento
      const checkoutUrl =
        data.invoiceUrl ?? data.bankSlipUrl ?? data.paymentLink ?? "";

      return {
        gatewaySubscriptionId: data.id,
        checkoutUrl,
      };
    },

    async cancelSubscription(
      params: GatewayCancelParams,
    ): Promise<void> {
      await request<unknown>(
        "DELETE",
        `/subscriptions/${params.gatewaySubscriptionId}`,
      );
    },
  };
}
