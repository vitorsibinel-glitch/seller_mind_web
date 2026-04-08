"use client";

import { useGet } from "@/hooks/use-api";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, Rocket, Star, Zap, ArrowRight } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import type { Plan } from "@workspace/mongodb/models/plan";
import { Button } from "@workspace/ui/components/button";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import type { BillingAccount } from "@workspace/mongodb/models/billing-account";

interface PlanWithId extends Plan {
  _id: string;
}

interface PlansResponse {
  plans: PlanWithId[];
}

interface MeResponse {
  user: { billingAccount?: Pick<BillingAccount, "gateway"> };
}

type Billing = "monthly" | "annual";

function PlanCard({
  plan,
  billing,
  onSelect,
}: {
  plan: PlanWithId;
  billing: Billing;
  onSelect: (plan: PlanWithId) => void;
}) {
  const price =
    billing === "monthly"
      ? plan.prices.monthly
      : Number((plan.prices.annual / 12).toFixed(2));

  const totalAnnual = plan.prices.annual;
  const isPopular = plan.isPopular;

  return (
    <div
      className={cn(
        "relative flex flex-col h-full rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
        isPopular
          ? "border-primary shadow-lg shadow-primary/10 scale-[1.02]"
          : "border-border shadow-sm hover:border-primary/40",
      )}
    >
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-md">
            <Star className="h-3 w-3 fill-current" />
            Mais Popular
          </span>
        </div>
      )}

      <div className="p-6 pb-4">
        <span
          className={cn(
            "inline-block rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wider mb-3",
            plan.tier === "basic"
              ? "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400"
              : "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400",
          )}
        >
          {plan.tier}
        </span>

        <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>

        {plan.description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {plan.description}
          </p>
        )}

        <div className="mt-4">
          <div className="flex items-end gap-1">
            <span className="text-3xl font-bold tracking-tight text-foreground">
              R$ {price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
            <span className="mb-1 text-sm text-muted-foreground">/mês</span>
          </div>

          {billing === "annual" && (
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              R${" "}
              {totalAnnual.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}{" "}
              cobrado anualmente
            </p>
          )}
        </div>
      </div>

      <div className="mx-6 h-px bg-border" />

      <div className="flex-1 p-6 pt-4 space-y-2.5">
        {plan.limits.maxOrders && (
          <div className="flex items-center gap-2.5 text-sm">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Check className="h-3 w-3 text-primary" strokeWidth={3} />
            </span>
            <span className="font-medium text-foreground">
              Até {plan.limits.maxOrders.toLocaleString("pt-BR")} pedidos/mês
            </span>
          </div>
        )}

        {plan.limits.gamificationBonus && (
          <div className="flex items-center gap-2.5 text-sm">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40">
              <Zap className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            </span>
            <span className="text-muted-foreground">
              Bônus gamificação: R${" "}
              {plan.limits.gamificationBonus.toLocaleString("pt-BR")}
            </span>
          </div>
        )}

        {plan.features.map((feature) => (
          <div key={feature} className="flex items-center gap-2.5 text-sm">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Check className="h-3 w-3 text-primary" strokeWidth={3} />
            </span>
            <span className="text-muted-foreground">{feature}</span>
          </div>
        ))}

        {plan.trialDays > 0 && (
          <div className="mt-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            ✓ {plan.trialDays} dias grátis incluídos
          </div>
        )}
      </div>

      <div className="p-6 pt-0">
        <Button
          type="button"
          onClick={() => onSelect(plan)}
          className={cn(
            "w-full rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2",
            isPopular
              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
              : "border border-border bg-background text-foreground hover:bg-muted hover:border-primary/40",
          )}
        >
          Assinar plano
          {isPopular ? (
            <Rocket className="h-4 w-4" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

function PlanSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 animate-pulse space-y-4 h-full">
      <div className="h-4 w-16 rounded bg-muted" />
      <div className="h-5 w-24 rounded bg-muted" />
      <div className="h-8 w-32 rounded bg-muted" />
      <div className="h-px bg-muted" />
      <div className="space-y-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-2">
            <div className="h-5 w-5 rounded-full bg-muted flex-shrink-0" />
            <div className="h-5 flex-1 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="h-10 rounded-xl bg-muted" />
    </div>
  );
}

export default function PlansPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, fetchUser } = useAuth();
  const [billing, setBilling] = useState<Billing>("monthly");

  // mode=upgrade: exibe apenas o plano recomendado, sem listar todos
  const upgradeMode = searchParams.get("mode") === "upgrade";
  const recommendedSlug = searchParams.get("recommended") ?? "";

  useEffect(() => {
    fetchUser();

    if (!user) {
      router.push("/login");
    }
  }, [user]);

  const { data, isLoading } = useGet<PlansResponse>("/api/plans");

  // Busca o gateway do billing account do usuário para determinar qual
  // fluxo de checkout usar. Clientes Eduzz existentes têm gateway="eduzz".
  const { data: meData } = useGet<MeResponse>("/api/users/me");
  const gateway = meData?.user?.billingAccount?.gateway ?? "eduzz";

  const allPlans = data?.plans ?? [];

  // Em modo upgrade, exibe apenas o plano recomendado pelo banner
  const visiblePlans = upgradeMode && recommendedSlug
    ? allPlans.filter((p) => p.slug === recommendedSlug)
    : allPlans;

  const basicPlans = visiblePlans.filter((p) => p.tier === "basic");
  const advancedPlans = visiblePlans.filter((p) => p.tier === "advanced");

  const handleSelectPlan = async (plan: PlanWithId) => {
    const slug = plan.slug;

    if (gateway === "asaas") {
      // Novos clientes: vai para a tela de seleção de método de pagamento
      const price =
        billing === "monthly" ? plan.prices.monthly : plan.prices.annual;
      router.push(
        `/checkout/asaas?plan=${slug}&cycle=${billing}&planName=${encodeURIComponent(plan.name)}&price=${price}`,
      );
      return;
    }

    // Clientes Eduzz existentes: fluxo original inalterado
    try {
      const res = await fetch(
        `/api/checkout/eduzz?planSlug=${slug}&billingCycle=${billing}`,
        { credentials: "include" },
      );
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Erro ao gerar checkout");
        return;
      }

      window.location.href = data.checkoutUrl;
    } catch {
      toast.error("Erro ao redirecionar para pagamento");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground">
              {upgradeMode ? "Plano recomendado para você" : "Escolha seu plano"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {upgradeMode
                ? "Baseado no seu volume de vendas deste mês"
                : "Todos os planos incluem período de teste gratuito"}
            </p>
          </div>

          <div className="inline-flex w-full sm:w-auto items-center justify-between sm:justify-start rounded-full border border-border bg-muted p-1 gap-1">
            {(["monthly", "annual"] as Billing[]).map((cycle) => (
              <button
                key={cycle}
                type="button"
                onClick={() => setBilling(cycle)}
                className={cn(
                  "relative flex-1 sm:flex-none px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 text-center",
                  billing === cycle
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {cycle === "monthly" ? "Mensal" : "Anual"}
                {cycle === "annual" && (
                  <span className="ml-2 text-xs font-semibold text-emerald-500">
                    -17%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12 sm:space-y-16">
        <section>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <span className="inline-block rounded-md bg-sky-100 dark:bg-sky-950/50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400 mb-2">
                Basic
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Planos Basic
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ideal para vendedores iniciando no marketplace
              </p>
            </div>
          </div>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 auto-rows-fr">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <PlanSkeleton key={i} />
                ))
              : basicPlans.map((plan) => (
                  <PlanCard
                    key={plan._id}
                    plan={plan}
                    billing={billing}
                    onSelect={(p) => handleSelectPlan(p)}
                  />
                ))}
          </div>
        </section>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium text-center">
            Para operações maiores
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <section>
          <div className="mb-8">
            <span className="inline-block rounded-md bg-violet-100 dark:bg-violet-950/50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-400 mb-2">
              Advanced
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              Planos Advanced
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Para vendedores com alto volume e operações escaláveis
            </p>
          </div>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 auto-rows-fr">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <PlanSkeleton key={i} />
                ))
              : advancedPlans.map((plan) => (
                  <PlanCard
                    key={plan._id}
                    plan={plan}
                    billing={billing}
                    onSelect={(p) => handleSelectPlan(p)}
                  />
                ))}
          </div>
        </section>

        <div className="text-center pb-8 space-y-2">
          <p className="text-sm text-muted-foreground">
            ✓ Sem cartão de crédito · ✓ Cancele quando quiser · ✓ Suporte
            incluso
          </p>
          <p className="text-xs text-muted-foreground/60">
            Precisa de um plano personalizado?{" "}
            <a
              href="#"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Fale com nossa equipe
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
