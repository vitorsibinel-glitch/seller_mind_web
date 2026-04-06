"use client";

import { useSubscriptionGuard } from "@/hooks/use-subscription-guard";
import { TrialCountdown } from "@/components/trial-countdown";
import type { ReactNode } from "react";

interface SubscriptionGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function SubscriptionGuard({
  children,
  fallback,
}: SubscriptionGuardProps) {
  const {
    isCheckingSubscription,
    hasActiveSubscription,
    isInGrace,
    isInTolerance,
    gracePeriodEnd,
    tolerancePeriodEnd,
  } = useSubscriptionGuard();

  if (isCheckingSubscription) {
    return (
      fallback ?? (
        <div className="flex min-h-svh items-center justify-center">
          <p className="text-sm text-muted-foreground">Verificando acesso...</p>
        </div>
      )
    );
  }

  if (!hasActiveSubscription) {
    return null;
  }

  const deadline = isInGrace ? gracePeriodEnd : isInTolerance ? tolerancePeriodEnd : undefined;
  const countdownVariant = isInTolerance ? "payment" : "trial";

  return (
    <>
      {deadline && (
        <TrialCountdown deadline={deadline} variant={countdownVariant} />
      )}
      {children}
    </>
  );
}
