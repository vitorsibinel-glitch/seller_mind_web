"use client";

import { SectionCards } from "@/components/sections-cards";
import { DashboardHeader } from "@/components/dashboard-header";
import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGet } from "@/hooks/use-api";
import { useGlobalFilter } from "@/contexts/global-filter-context";
import { TopProducts } from "@/components/top-products";
import { PeriodEnum } from "@/utils/get-period";
import type { DashboardDataResponseDTO } from "@/dtos/orders-response-dto";

export default function Dashboard() {
  const {
    selectedStoreId,
    period,
    handlePeriod,
    customStartDate,
    customEndDate,
  } = useGlobalFilter();
  const queryClient = useQueryClient();

  const overviewUrl = useMemo(() => {
    if (!selectedStoreId) return null;

    const params = new URLSearchParams({
      storeId: selectedStoreId,
      period: period,
    });

    if (period === PeriodEnum.CUSTOM && customStartDate && customEndDate) {
      params.append("startDate", customStartDate);
      params.append("endDate", customEndDate);
    }

    return `/api/analytics/overview?${params.toString()}`;
  }, [selectedStoreId, period, customStartDate, customEndDate]);

  const isCustomIncomplete =
    period === PeriodEnum.CUSTOM && (!customStartDate || !customEndDate);

  const {
    data: overviewData,
    refetch: refetchOverview,
    isFetching,
    isLoading: isInitialLoading,
  } = useGet<DashboardDataResponseDTO>(overviewUrl!, {
    enabled: !!selectedStoreId && !isCustomIncomplete,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const isCalculating = isFetching || (isInitialLoading && !isCustomIncomplete);

  useEffect(() => {
    if (!selectedStoreId) return;

    if (period === PeriodEnum.CUSTOM && (!customStartDate || !customEndDate)) {
      return;
    }

    queryClient.removeQueries({
      queryKey: [overviewUrl],
      exact: false,
    });
    refetchOverview();
  }, [
    period,
    selectedStoreId,
    overviewUrl,
    queryClient,
    refetchOverview,
    customStartDate,
    customEndDate,
  ]);

  const stats = !overviewData?.stats
    ? {
        totalOrders: 0,
        approvedOrders: 0,
        totalUnitsQuantity: 0,
        totalRevenue: 0,
        totalProfit: 0,
        profitMargin: 0,
        netMarketplace: 0,
        ticketAverageNet: 0,
        adsCost: 0,
        tacos: 0,
        roi: 0,
        profitAfterAds: 0,
        marginAfterAds: 0,
      }
    : {
        totalOrders: overviewData.stats.totalOrders,
        approvedOrders: overviewData.stats.approvedOrders,
        totalUnitsQuantity: overviewData.stats.totalUnitsQuantity,
        totalRevenue: overviewData.stats.financial.totalRevenue,
        totalProfit: overviewData.stats.financial.totalProfit,
        profitMargin: overviewData.stats.financial.profitMargin,
        netMarketplace: overviewData.stats.financial.totalNetMarketplace,
        ticketAverageNet: overviewData.stats.financial.ticketAverageNet,
        adsCost: overviewData.stats.financial.totalAdsCostByProduct,
        tacos: overviewData.stats.ads.tacos,
        roi: overviewData.stats.ads.roi,
        profitAfterAds: overviewData.stats.financial.totalProfitAfterAds,
        marginAfterAds: overviewData.stats.ads.marginAfterAds,
      };

  const topProducts = overviewData?.stats?.products?.topProducts || [];

  const lastAdsUpdatedAt = overviewData?.stats?.ads?.fetchedAt ?? null;
  const isProcessing = false;

  return (
    <main className="flex flex-col gap-4">
      <DashboardHeader
        isProcessing={isProcessing}
        lastAdsUpdatedAt={lastAdsUpdatedAt}
        handlePeriod={handlePeriod}
        period={period}
      />

      {!selectedStoreId && (
        <div className="p-4 rounded-lg bg-muted/40 border border-muted-foreground/20 text-sm text-muted-foreground">
          Nenhuma loja selecionada. Conecte sua loja para visualizar as métricas
          do dashboard.
        </div>
      )}

      <SectionCards stats={stats} isCalculating={isCalculating} />

      {selectedStoreId && (
        <TopProducts products={topProducts} isLoading={isCalculating} />
      )}
    </main>
  );
}
