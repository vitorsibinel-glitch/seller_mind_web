"use client";

import { useRouter } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { useGet } from "@/hooks/use-api";
import { useGlobalFilter } from "@/contexts/global-filter-context";

interface RecommendationResponse {
  currentUnits: number;
  planLimit: number;
  utilizationPct: number;
  currentPlan: { name: string; slug: string };
  recommendedPlan: { name: string; slug: string; prices: { monthly: number; annual: number } } | null;
}

const WARN_THRESHOLD = 80; // exibe quando >= 80% do limite

export function UpgradeBanner() {
  const router = useRouter();
  const { selectedStoreId } = useGlobalFilter();

  const { data } = useGet<RecommendationResponse>(
    `/api/subscriptions/upgrade-recommendation?storeId=${selectedStoreId}`,
    {
      enabled: !!selectedStoreId,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  );

  if (
    !data ||
    !data.recommendedPlan ||
    data.utilizationPct < WARN_THRESHOLD
  ) {
    return null;
  }

  const { currentUnits, planLimit, utilizationPct, recommendedPlan } = data;

  const barColor =
    utilizationPct >= 100
      ? "bg-red-500"
      : utilizationPct >= 90
        ? "bg-orange-500"
        : "bg-amber-400";

  return (
    <div className="mx-4 mt-4 md:mx-6 rounded-xl border border-amber-400/30 bg-amber-50 dark:bg-amber-950/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
            <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
              {utilizationPct >= 100
                ? "Limite de unidades atingido"
                : `${utilizationPct}% do limite utilizado`}
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              {currentUnits.toLocaleString("pt-BR")} de{" "}
              {planLimit.toLocaleString("pt-BR")} unidades vendidas este mês
            </p>
            {/* Barra de progresso */}
            <div className="mt-1.5 h-1.5 w-48 rounded-full bg-amber-200 dark:bg-amber-900/60">
              <div
                className={`h-full rounded-full transition-all ${barColor}`}
                style={{ width: `${Math.min(utilizationPct, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              `/plans?mode=upgrade&recommended=${recommendedPlan.slug}`,
            )
          }
          className="flex-shrink-0 rounded-lg border border-amber-400 bg-amber-400/20 px-4 py-2 text-xs font-semibold text-amber-900 dark:text-amber-300 transition-colors hover:bg-amber-400/30 whitespace-nowrap"
        >
          Ver plano {recommendedPlan.name}
        </button>
      </div>
    </div>
  );
}
