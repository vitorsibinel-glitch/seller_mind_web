"use client";

import { useSubscriptionGuard } from "@/hooks/use-subscription-guard";
import type { ReactNode } from "react";

interface SubscriptionGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function SubscriptionGuard({
  children,
  fallback,
}: SubscriptionGuardProps) {
  const { isCheckingSubscription, hasActiveSubscription } =
    useSubscriptionGuard();

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

  return <>{children}</>;
}
