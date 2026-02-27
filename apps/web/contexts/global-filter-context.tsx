"use client";

import { PeriodEnum } from "@/utils/get-period";
import { createContext, useContext, useState } from "react";

export type GlobalFilterContextType = {
  period: string;
  handlePeriod: (period: PeriodEnum) => void;

  handleSelectedStoreId: (storeId: string | null) => void;
  selectedStoreId: string | null;

  isStoreIntegrated: boolean;
  handleIsStoreIntegrated: (integrated: boolean) => void;

  customStartDate: string | null;
  customEndDate: string | null;
  handleCustomDates: (start: string, end: string) => void;
};

export const GlobalFilterContext =
  createContext<GlobalFilterContextType | null>(null);

export function GlobalFilterPrrovider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [period, setPeriod] = useState<PeriodEnum>(PeriodEnum.TODAY);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [isStoreIntegrated, setIsStoreIntegrated] = useState<boolean>(false);
  const [customStartDate, setCustomStartDate] = useState<string | null>(null);
  const [customEndDate, setCustomEndDate] = useState<string | null>(null);

  const handlePeriod = (
    newPeriod: PeriodEnum,
    customDates?: { startDate: string; endDate: string },
  ) => {
    setPeriod(newPeriod);

    if (newPeriod === PeriodEnum.CUSTOM && customDates) {
      setCustomStartDate(customDates.startDate);
      setCustomEndDate(customDates.endDate);
    } else if (newPeriod !== PeriodEnum.CUSTOM) {
      setCustomStartDate("");
      setCustomEndDate("");
    }
  };

  function handleCustomDates(start: string, end: string) {
    setCustomStartDate(start);
    setCustomEndDate(end);
    setPeriod(PeriodEnum.CUSTOM);
  }

  function handleSelectedStoreId(storeId: string | null) {
    setSelectedStoreId(storeId);
  }

  function handleIsStoreIntegrated(integrated: boolean) {
    setIsStoreIntegrated(integrated);
  }

  return (
    <GlobalFilterContext.Provider
      value={{
        period,
        selectedStoreId,
        isStoreIntegrated,
        handlePeriod,
        handleSelectedStoreId,
        handleIsStoreIntegrated,
        customStartDate,
        customEndDate,
        handleCustomDates,
      }}
    >
      {children}
    </GlobalFilterContext.Provider>
  );
}

export function useGlobalFilter() {
  const ctx = useContext(GlobalFilterContext);
  if (!ctx)
    throw new Error("useGlobalFilter must be used inside <AuthProvider>");
  return ctx;
}
