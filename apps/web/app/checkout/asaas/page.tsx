"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, QrCode, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { toast } from "sonner";

type PaymentMethod = "credit_card" | "pix";
type BillingCycle = "monthly" | "annual";

export default function CheckoutAsaasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const planSlug = searchParams.get("plan") ?? "";
  const billingCycle = (searchParams.get("cycle") ?? "monthly") as BillingCycle;
  const planName = searchParams.get("planName") ?? planSlug;
  const planPrice = searchParams.get("price") ?? "";

  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethod>("credit_card");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!planSlug) {
      router.replace("/plans");
    }
  }, [planSlug, router]);

  const handleCheckout = async () => {
    if (!planSlug) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/checkout/asaas", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planSlug,
          billingCycle,
          paymentMethod: selectedMethod,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message ?? "Erro ao gerar link de pagamento");
        return;
      }

      if (!data.checkoutUrl) {
        toast.error("Link de pagamento não retornado");
        return;
      }

      window.location.href = data.checkoutUrl;
    } catch {
      toast.error("Erro ao redirecionar para pagamento");
    } finally {
      setIsLoading(false);
    }
  };

  const formattedPrice = planPrice
    ? `R$ ${Number(planPrice).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    : null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          {/* Resumo do plano */}
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Plano selecionado
            </p>
            <h1 className="text-xl font-bold text-foreground">{planName}</h1>
            <p className="text-sm text-muted-foreground">
              {billingCycle === "monthly" ? "Cobrança mensal" : "Cobrança anual"}
              {formattedPrice && (
                <span className="ml-1 font-semibold text-foreground">
                  · {formattedPrice}
                  {billingCycle === "monthly" ? "/mês" : "/ano"}
                </span>
              )}
            </p>
          </div>

          <div className="h-px bg-border" />

          {/* Seleção do método de pagamento */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">
              Forma de pagamento
            </p>

            {(
              [
                {
                  method: "credit_card" as PaymentMethod,
                  icon: CreditCard,
                  label: "Cartão de Crédito",
                  description: "Aprovação imediata",
                },
                {
                  method: "pix" as PaymentMethod,
                  icon: QrCode,
                  label: "Pix",
                  description: "Aprovação em minutos",
                },
              ] as const
            ).map(({ method, icon: Icon, label, description }) => (
              <button
                key={method}
                type="button"
                onClick={() => setSelectedMethod(method)}
                className={cn(
                  "w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200",
                  selectedMethod === method
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border bg-background hover:border-primary/40 hover:bg-muted/50",
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full",
                    selectedMethod === method
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {label}
                  </p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <span
                  className={cn(
                    "ml-auto h-4 w-4 rounded-full border-2 flex-shrink-0",
                    selectedMethod === method
                      ? "border-primary bg-primary"
                      : "border-border",
                  )}
                />
              </button>
            ))}
          </div>

          <Button
            type="button"
            onClick={handleCheckout}
            disabled={isLoading}
            className="w-full rounded-xl py-3 text-sm font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Aguarde...
              </>
            ) : (
              "Ir para pagamento"
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Você será redirecionado para o ambiente seguro do Asaas.
            <br />
            Seus dados de pagamento não passam pelos nossos servidores.
          </p>
        </div>
      </div>
    </div>
  );
}
