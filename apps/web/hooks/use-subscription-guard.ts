import { useRouter, useSearchParams } from "next/navigation";
import { useGet } from "./use-api";
import { useEffect } from "react";

interface SubscriptionStatusResponse {
  hasActiveSubscription: boolean;
}

export function useSubscriptionGuard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justSubscribed = searchParams.get("subscribed") === "true";

  const { data, isPending, isError } = useGet<SubscriptionStatusResponse>(
    "/api/subscriptions/status",
    {
      staleTime: justSubscribed ? 0 : undefined,
    },
  );

  useEffect(() => {
    if (isError || isPending || justSubscribed) return;

    if (!data?.hasActiveSubscription) {
      const selectedPlan = localStorage.getItem("selected_plan");
      router.replace(selectedPlan ? "/checkout" : "/plans");
    }
  }, [data, isPending, isError, router, justSubscribed]);

  return {
    isCheckingSubscription: isPending,
    hasActiveSubscription: justSubscribed
      ? true
      : (data?.hasActiveSubscription ?? false),
  };
}
