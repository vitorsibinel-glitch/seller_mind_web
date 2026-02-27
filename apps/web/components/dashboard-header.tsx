import { formatDate, formatDateWithTime } from "@/lib/format-date";
import { PeriodEnum } from "@/utils/get-period";
import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { StoreSelector } from "./store-selector";
import { Input } from "@workspace/ui/components/input";
import { Calendar, Check, Filter } from "lucide-react";
import { useState } from "react";

interface Props {
  isProcessing: boolean;
  lastAdsUpdatedAt: string | null;

  handlePeriod: (
    period: PeriodEnum,
    dateRange?: { startDate: string; endDate: string },
  ) => void;
  period: string;
}

export function DashboardHeader({
  isProcessing,
  lastAdsUpdatedAt,
  handlePeriod,
  period,
}: Props) {
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempEndDate, setTempEndDate] = useState("");

  const handleApplyCustomDate = () => {
    if (tempStartDate && tempEndDate) {
      handlePeriod(PeriodEnum.CUSTOM, {
        startDate: tempStartDate,
        endDate: tempEndDate,
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-sidebar dark:bg-sidebar p-4 rounded-sm border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Visão Geral
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <StoreSelector />
          <div className="flex items-center">
            <Select
              value={period}
              onValueChange={(value) => handlePeriod(value as PeriodEnum)}
            >
              <SelectTrigger className="w-[140px]">
                <Calendar className="w-5" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PeriodEnum.TODAY}>Hoje</SelectItem>
                <SelectItem value={PeriodEnum.YESTERDAY}>Ontem</SelectItem>
                <SelectItem value={PeriodEnum.WEEK}>7 dias</SelectItem>
                <SelectItem value={PeriodEnum.FIFTEEN_DAYS}>15 dias</SelectItem>
                <SelectItem value={PeriodEnum.MONTH}>30 dias</SelectItem>
                <SelectItem value={PeriodEnum.CUSTOM}>Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {period === PeriodEnum.CUSTOM && (
        <div className="bg-sidebar p-4 rounded-sm border border-gray-200 dark:border-gray-800 animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Filter className="h-4 w-4" />
              <span>Filtrar por Período Específico</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Data Início
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Data Fim
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <Button
                onClick={handleApplyCustomDate}
                disabled={!tempStartDate || !tempEndDate || isProcessing}
                className="w-full sm:w-auto"
              >
                <Check className="h-4 w-4 mr-2" />
                Aplicar Filtro
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
