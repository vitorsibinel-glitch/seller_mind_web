"use client";

import { PageHeader } from "@/components/page-header";
import { StoreSelector } from "@/components/store-selector";
import { useGlobalFilter } from "@/contexts/global-filter-context";
import { useGet } from "@/hooks/use-api";
import { formatCurrency } from "@/utils/format-currency";
import { DREPeriodEnum } from "@/utils/get-dre-period";

import { Card, CardContent } from "@workspace/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Tabs, TabsContent } from "@workspace/ui/components/tabs";
import { cn } from "@workspace/ui/lib/utils";
import { Calendar, Filter, Check } from "lucide-react";

import { useEffect, useMemo, useState } from "react";

interface DRELine {
  descricao: string;
  valor: number;
  nivel?: number;
  destaque?: boolean;
  final?: boolean;
}

interface DREData {
  receitas: DRELine[];
  custos: DRELine[];
  despesas: DRELine[];
  resultado: DRELine[];
  netMargin: number;
}

export default function DrePage() {
  const { selectedStoreId } = useGlobalFilter();

  const [period, setPeriod] = useState<DREPeriodEnum>(
    DREPeriodEnum.CURRENT_MONTH,
  );

  const [tempStartDate, setTempStartDate] = useState("");
  const [tempEndDate, setTempEndDate] = useState("");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const isCustomIncomplete =
    period === DREPeriodEnum.CUSTOM && (!customStartDate || !customEndDate);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      storeId: selectedStoreId || "",
      period,
    });

    if (period === DREPeriodEnum.CUSTOM && customStartDate && customEndDate) {
      params.set("startDate", customStartDate);
      params.set("endDate", customEndDate);
    }

    return params.toString();
  }, [selectedStoreId, period, customStartDate, customEndDate]);

  const url = `/api/finances/dre?${queryString}`;

  const {
    data: dreData,
    isLoading,
    refetch,
  } = useGet<DREData>(url, {
    enabled: !!selectedStoreId && !isCustomIncomplete,
  });

  useEffect(() => {
    if (!selectedStoreId) return;
    if (isCustomIncomplete) return;
    refetch();
  }, [url, selectedStoreId, isCustomIncomplete, refetch]);

  const calculatePercentage = (value: number) => {
    if (!dreData) return "0.0";
    const receitaBruta =
      dreData.receitas.find(
        (item) => item.descricao === "Receita Bruta de Vendas",
      )?.valor || 1;
    return ((value / receitaBruta) * 100).toFixed(1);
  };

  const renderLine = (item: DRELine, index: number) => {
    const isSubitem = item.nivel === 1;
    const isHighlight = item.destaque;
    const isFinal = item.final;

    return (
      <TableRow
        key={index}
        className={cn(
          "border-b",
          isHighlight && "font-medium bg-sidebar",
          isFinal && "bg-primary/50 font-semibold",
        )}
      >
        <TableCell
          className={cn(
            isSubitem && "pl-8",
            (isHighlight || isFinal) && "text-lg py-3",
          )}
        >
          {item.descricao}
        </TableCell>
        <TableCell className="text-right">
          {formatCurrency(item.valor)}
        </TableCell>
        <TableCell className="text-right w-24">
          {calculatePercentage(item.valor)}%
        </TableCell>
      </TableRow>
    );
  };

  const netProfitMargin = dreData?.netMargin?.toFixed(2) ?? "0.0";

  return (
    <div className="space-y-6">
      <PageHeader
        title="DRE - Demonstração do Resultado do Exercício"
        description="Análise financeira detalhada dos resultados da operação"
      />

      <div className="p-4 rounded-lg border shadow-sm space-y-4 bg-sidebar">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="ml-auto flex flex-col sm:flex-row sm:items-center gap-4">
            <StoreSelector />
            <Select
              value={period}
              onValueChange={(value) => setPeriod(value as DREPeriodEnum)}
            >
              <SelectTrigger className="w-[200px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DREPeriodEnum.CURRENT_MONTH}>
                  Mês Atual
                </SelectItem>
                <SelectItem value={DREPeriodEnum.LAST_MONTH}>
                  Mês Anterior
                </SelectItem>
                <SelectItem value={DREPeriodEnum.LAST_3_MONTHS}>
                  Últimos 3 Meses
                </SelectItem>
                <SelectItem value={DREPeriodEnum.CURRENT_YEAR}>
                  Ano Atual
                </SelectItem>
                <SelectItem value={DREPeriodEnum.LAST_YEAR}>
                  Ano Anterior
                </SelectItem>
                <SelectItem value={DREPeriodEnum.CUSTOM}>
                  Personalizado
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {period === DREPeriodEnum.CUSTOM && (
        <div className="bg-sidebar p-4 rounded-sm border animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Filter className="h-4 w-4" />
              <span>Filtrar por Período Específico</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Data Início
                </label>
                <input
                  type="date"
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={tempEndDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  className="w-full"
                />
              </div>

              <button
                onClick={() => {
                  setCustomStartDate(tempStartDate);
                  setCustomEndDate(tempEndDate);
                }}
                disabled={!tempStartDate || !tempEndDate}
                className="h-10 rounded-md bg-primary text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" />
                Aplicar Filtro
              </button>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="dre" className="space-y-4">
        <TabsContent value="dre">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Carregando dados...
                </div>
              ) : !dreData ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum dado disponível para o período selecionado
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-sidebar">
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">% da Receita</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dreData.receitas.map(renderLine)}
                    {dreData.custos.map(renderLine)}
                    {dreData.despesas.map(renderLine)}
                    {dreData.resultado.map(renderLine)}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {!isLoading && dreData && (
            <div className="p-4 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold mb-2">
                Análise de Desempenho
              </h3>
              <p className="text-muted-foreground">
                A margem de lucro líquido no período foi de{" "}
                <span className="font-medium text-primary">
                  {netProfitMargin}%
                </span>
                .
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
