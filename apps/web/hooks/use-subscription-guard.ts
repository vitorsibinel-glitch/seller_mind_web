import { useRouter, useSearchParams } from "next/navigation";
import { useGet } from "./use-api";
import { useEffect } from "react";

export type SubscriptionAccessStatus =
  | "trialing"
  | "trial_grace"
  | "active"
  | "past_due_tolerance"
  | "expired"
  | "past_due"
  | "suspended"
  | "canceled"
  | "no_account"
  | "no_subscription";

export interface SubscriptionStatusResponse {
  hasAccess: boolean;
  status: SubscriptionAccessStatus;
  planId?: string | null;
  trialEnd?: string;
  gracePeriodEnd?: string;
  tolerancePeriodEnd?: string;
  currentPeriodEnd?: string;
}

export function useSubscriptionGuard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justSubscribed = searchParams.get("subscribed") === "true";

  const { data, isPending, isError } = useGet<SubscriptionStatusResponse>(
    "/api/subscriptions/status",
    { staleTime: justSubscribed ? 0 : undefined },
  );

  const status = data?.status;

  // Períodos de tolerância — usuário mantém acesso mas vê aviso
  const isInGrace = status === "trial_grace";
  const isInTolerance = status === "past_due_tolerance";
  const isInWarningPeriod = isInGrace || isInTolerance;

  const hasAccess = justSubscribed ? true : (data?.hasAccess ?? false);

  useEffect(() => {
    if (isPending || isError || justSubscribed) return;
    // Não redireciona durante períodos de tolerância — apenas mostra aviso
    if (!hasAccess && !isInWarningPeriod) {
      router.replace("/plans");
    }
  }, [hasAccess, isPending, isError, isInWarningPeriod, justSubscribed, router]);

  return {
    isCheckingSubscription: isPending,
    hasActiveSubscription: hasAccess,
    isInGrace,
    isInTolerance,
    isInWarningPeriod,
    gracePeriodEnd: data?.gracePeriodEnd
      ? new Date(data.gracePeriodEnd)
      : undefined,
    tolerancePeriodEnd: data?.tolerancePeriodEnd
      ? new Date(data.tolerancePeriodEnd)
      : undefined,
    trialEnd: data?.trialEnd ? new Date(data.trialEnd) : undefined,
    status: data?.status,
  };
}
