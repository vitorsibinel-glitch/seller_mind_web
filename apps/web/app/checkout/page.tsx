"use client";

import { DefaultButton } from "@/components/default-button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGet, usePost } from "@/hooks/use-api";
import { toast } from "sonner";
import { cn } from "@workspace/ui/lib/utils";
import {
  CheckIcon,
  ChevronLeft,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { sanitizeCnpjCpf } from "@/utils/sanitize-cnpj-cpf";
import {
  checkoutSchema,
  type CheckoutFormData,
} from "@/schemas/checkoutSchema";
import type {
  SelectedPlanDataDTO,
  SelectedPlanDTO,
} from "@/dtos/selected-plan-dto";
import { Button } from "@workspace/ui/components/button";
import { useAuth } from "@/contexts/auth-context";
import { useSaveCard } from "@/hooks/use-save-card";

function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, "")
    .substring(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function detectBrand(number: string): "visa" | "mastercard" | "amex" | null {
  const n = number.replace(/\s/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^5[1-5]/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  return null;
}

function currency(value: unknown) {
  const number = Number(value ?? 0);
  return number.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

function toNumberPrice(v: unknown): number {
  if (v == null) return 0;

  if (typeof v === "number") {
    return Number.isFinite(v) ? v : 0;
  }

  if (typeof v === "string") {
    const s = v
      .replace(/\s/g, "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, "");

    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  return 0;
}

function getPlanPrices(plan?: SelectedPlanDTO | null) {
  const monthly = toNumberPrice(plan?.prices?.monthly ?? 0);
  const annual = toNumberPrice(plan?.prices?.annual ?? 0);
  const monthlyEquivalent = Number((annual / 12 || 0).toFixed(2));
  return { monthly, annual, monthlyEquivalent };
}

type Cycle = "monthly" | "annual";

function CycleToggle({
  value,
  onChange,
}: {
  value: Cycle;
  onChange: (v: Cycle) => void;
}) {
  return (
    <div className="inline-flex w-full sm:w-auto items-center justify-between sm:justify-start rounded-full border border-border bg-muted p-1 gap-1">
      {(["monthly", "annual"] as Cycle[]).map((cycle) => (
        <button
          key={cycle}
          type="button"
          onClick={() => onChange(cycle)}
          className={cn(
            "relative flex-1 sm:flex-none px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 text-center",
            value === cycle
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
  );
}

function CardBrandIcon({ brand }: { brand: ReturnType<typeof detectBrand> }) {
  if (!brand) return null;
  const labels: Record<NonNullable<typeof brand>, string> = {
    visa: "VISA",
    mastercard: "MC",
    amex: "AMEX",
  };
  return (
    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground tracking-widest select-none">
      {labels[brand]}
    </span>
  );
}

function UserDropdown() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-4 h-4 text-primary" />
        </div>
        <span className="text-sm font-medium hidden sm:inline-block">
          {user.firstName}
        </span>
        <ChevronDown
          className={cn("w-4 h-4 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-xl shadow-lg py-1 z-20">
            <button
              onClick={() => logout()}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair da conta
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function PlanSummary({
  cycle,
  plan,
  isLoading,
  onBack,
}: {
  cycle: Cycle;
  plan: SelectedPlanDTO | null;
  isLoading: boolean;
  onBack: () => void;
}) {
  if (isLoading) {
    return (
      <div className="w-full xl:w-1/2 bg-muted/40 xl:border-r border-border flex items-center justify-center p-8">
        Carregando plano...
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="w-full xl:w-1/2 bg-muted/40 xl:border-r border-border flex items-center justify-center p-8">
        Plano não encontrado
      </div>
    );
  }

  const { monthly, annual, monthlyEquivalent } = getPlanPrices(plan);

  return (
    <div className="w-full xl:w-1/2 bg-muted/40 xl:border-r border-border flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-16">
      <div className="max-w-md mx-auto w-full space-y-8">
        <Button
          className="text-muted-foreground w-fit"
          variant="ghost"
          onClick={onBack}
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </Button>

        <div className="rounded-2xl border border-border bg-background p-6 space-y-6 shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Plano selecionado
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {plan.name}
            </h2>
            <p className="text-sm text-muted-foreground">{plan.tier}</p>
          </div>

          {cycle === "monthly" ? (
            <div className="flex items-end gap-1">
              <span className="text-3xl sm:text-4xl font-bold">
                R$ {currency(monthly)}
              </span>
              <span className="text-muted-foreground text-sm mb-1">/mês</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-col">
                <span className="text-3xl sm:text-4xl font-bold">
                  R$ {currency(annual)}
                </span>
                <span className="text-sm text-muted-foreground">
                  cobrança anual
                </span>
              </div>

              <p className="text-xs text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-full inline-block">
                Equivalente a R$ {currency(monthlyEquivalent)} /mês
              </p>

              <p className="text-xs text-muted-foreground">
                Será cobrado R$ {currency(annual)} imediatamente.
              </p>
            </div>
          )}

          <ul className="space-y-3">
            {plan.limits?.maxOrders && (
              <li className="flex items-center gap-3 text-sm text-success">
                <CheckIcon className="w-4 h-4 text-success" />
                {plan.trialDays} dias grátis incluídos
              </li>
            )}

            {plan.limits?.maxOrders && (
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon className="w-4 h-4 text-primary" />
                Até {plan.limits.maxOrders} pedidos/mês
              </li>
            )}

            {plan.limits?.gamificationBonus && (
              <li className="flex items-center gap-3 text-sm">
                <CheckIcon className="w-4 h-4 text-primary" />
                Bônus de gamificação: R${" "}
                {currency(plan.limits.gamificationBonus)}
              </li>
            )}

            {plan.features.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm">
                <CheckIcon className="w-4 h-4 text-primary" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Cancele a qualquer momento. Sem multas.
        </p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { fetchUser, user } = useAuth();
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [cardNumber, setCardNumber] = useState("");
  const [selectedPlanSlug, setSelectedPlanSlug] = useState("");

  const { data: subscriptionStatus, isPending: checkingSubscription } = useGet<{
    hasActiveSubscription: boolean;
  }>("/api/subscriptions/status");

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (checkingSubscription) return;
    if (subscriptionStatus?.hasActiveSubscription) {
      router.replace("/dashboard");
    }
  }, [subscriptionStatus, checkingSubscription, router]);

  useEffect(() => {
    const storedPlan = localStorage.getItem("selected_plan");
    if (storedPlan) {
      setSelectedPlanSlug(storedPlan);
    } else {
      router.push("/plans");
    }
  }, [router]);

  const { data: selectedPlanData, isPending: selectedPlanDataIsPending } =
    useGet<SelectedPlanDataDTO>(`/api/plans/${selectedPlanSlug}`, {
      enabled: !!selectedPlanSlug,
    });

  const selectedPlan: SelectedPlanDTO | null = selectedPlanData?.plan || null;
  const brand = detectBrand(cardNumber);

  const { control, handleSubmit, formState } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    mode: "onChange",
  });

  const { mutateAsync: createIntent } = usePost<{
    intentId: string;
    hash: string;
  }>("/api/subscriptions/intent");

  const { mutateAsync: subscribe, isPending } = usePost("/api/subscriptions", {
    onSuccess: () => {
      toast.success("Assinatura realizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Erro ao processar pagamento");
    },
  });

  const {
    monthly: monthlyPrice,
    annual: annualPrice,
    monthlyEquivalent,
  } = getPlanPrices(selectedPlan);

  const totalToday = cycle === "monthly" ? monthlyPrice : annualPrice;

  const { saveCard } = useSaveCard();

  const onSubmit = async (data: CheckoutFormData) => {
    if (!selectedPlan) return;

    const { intentId, hash } = await createIntent({
      planId: selectedPlan._id,
      billingCycle: cycle,
    });

    const result = await saveCard({
      cardHolderName: data.cardHolderName,
      cardNumber: data.cardNumber,
      expirationMonth: data.expirationMonth,
      expirationYear: data.expirationYear,
      cvv: data.cvv,
      docNumber: data.docNumber,
    });

    if (!result) return;

    await subscribe({
      planId: selectedPlan._id,
      billingCycle: cycle,
      intentId,
    });

    router.push("/dashboard/welcome?subscribed=true");
  };

  if (checkingSubscription) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        Verificando assinatura...
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center">
          Carregando...
        </div>
      }
    >
      <div className="relative flex flex-col md:flex-row min-h-svh">
        <div className="absolute top-4 right-4 z-50">
          <UserDropdown />
        </div>
        <PlanSummary
          cycle={cycle}
          plan={selectedPlan}
          isLoading={selectedPlanDataIsPending}
          onBack={() => router.push("/plans")}
        />

        <div className="w-full xl:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-10 py-10">
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-xl sm:text-2xl font-bold">
                Dados de pagamento
              </h1>
              <p className="text-sm text-muted-foreground">
                Suas informações são criptografadas e protegidas.
              </p>
            </div>

            <div className="flex justify-center">
              <CycleToggle value={cycle} onChange={setCycle} />
            </div>

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <Controller
                name="cardNumber"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Número do cartão</Label>
                    <div className="relative">
                      <Input
                        id="cardNumber"
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={(e) => {
                          const formatted = formatCardNumber(e.target.value);
                          setCardNumber(formatted);
                          field.onChange(formatted);
                        }}
                        onBlur={field.onBlur}
                        maxLength={19}
                        className="pr-16 font-mono tracking-wider"
                      />
                      <CardBrandIcon brand={brand} />
                    </div>
                    <p className="text-red-500 text-sm">
                      {formState.errors.cardNumber?.message}
                    </p>
                  </div>
                )}
              />

              <Controller
                name="cardHolderName"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="cardHolderName">Nome no cartão</Label>
                    <Input
                      id="cardHolderName"
                      placeholder="Como está impresso no cartão"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                      className="uppercase tracking-wide"
                    />
                    <p className="text-red-500 text-sm">
                      {formState.errors.cardHolderName?.message}
                    </p>
                  </div>
                )}
              />

              <div className="grid grid-cols-3 gap-3">
                <Controller
                  name="expirationMonth"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="expirationMonth">Mês</Label>
                      <Input
                        id="expirationMonth"
                        placeholder="MM"
                        maxLength={2}
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value.replace(/\D/g, ""))
                        }
                        className="font-mono text-center"
                      />
                      <p className="text-red-500 text-xs">
                        {formState.errors.expirationMonth?.message}
                      </p>
                    </div>
                  )}
                />

                <Controller
                  name="expirationYear"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="expirationYear">Ano</Label>
                      <Input
                        id="expirationYear"
                        placeholder="AA"
                        maxLength={2}
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value.replace(/\D/g, ""))
                        }
                        className="font-mono text-center"
                      />
                      <p className="text-red-500 text-xs">
                        {formState.errors.expirationYear?.message}
                      </p>
                    </div>
                  )}
                />

                <Controller
                  name="cvv"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="•••"
                        maxLength={3}
                        type="password"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value.replace(/\D/g, ""))
                        }
                        className="font-mono text-center"
                      />
                      <p className="text-red-500 text-xs">
                        {formState.errors.cvv?.message}
                      </p>
                    </div>
                  )}
                />
              </div>

              <Controller
                name="docNumber"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="docNumber">CPF do titular</Label>
                    <Input
                      id="docNumber"
                      placeholder="000.000.000-00"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(sanitizeCnpjCpf(e.target.value))
                      }
                      onBlur={field.onBlur}
                      maxLength={14}
                      className="font-mono tracking-wider"
                    />
                    <p className="text-red-500 text-sm">
                      {formState.errors.docNumber?.message}
                    </p>
                  </div>
                )}
              />

              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">
                  Resumo da cobrança
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {selectedPlan && (
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>
                      Plano {selectedPlan.name} (
                      {cycle === "monthly" ? "Mensal" : "Anual"})
                    </span>
                    <span>R$ {currency(totalToday)}</span>
                  </div>

                  {cycle === "annual" && (
                    <div className="flex justify-between text-muted-foreground text-xs">
                      <span>Equivalente a</span>
                      <span>R$ {currency(monthlyEquivalent)} /mês</span>
                    </div>
                  )}

                  <div className="flex justify-between font-semibold text-foreground pt-1 border-t border-border">
                    <span>Total hoje</span>
                    <span>R$ {currency(totalToday)}</span>
                  </div>
                </div>
              )}

              <DefaultButton
                type="submit"
                disabled={!formState.isValid || isPending}
              >
                {isPending ? "Processando..." : "Confirmar assinatura"}
              </DefaultButton>
            </form>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Pagamento seguro com criptografia SSL
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Ao confirmar, você concorda com nossos{" "}
              <a href="#" className="underline">
                Termos de serviço
              </a>{" "}
              e{" "}
              <a href="#" className="underline">
                Política de Privacidade
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
