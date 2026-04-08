import { env } from "@/env";

export type ReferralStatus = "pending" | "paid" | "refunded";

/**
 * Mapeamento de status de referral para labels em português
 */
export const REFERRAL_STATUS_LABELS: Record<ReferralStatus, string> = {
  pending: "Aguardando pagamento",
  paid: "Comissão confirmada",
  refunded: "Reembolsado",
};

/**
 * Gera link de referência no padrão: https://seudominio.com?ref=CODE
 */
export function generateReferralLink(referralCode: string): string {
  const baseUrl = env.NEXT_PUBLIC_APP_URL || "https://sellermind.com";
  const url = new URL(baseUrl);
  url.searchParams.set("ref", referralCode);
  return url.toString();
}

/**
 * Extrai código de referência da URL
 */
export function extractReferralCode(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get("ref");
  } catch {
    return null;
  }
}
