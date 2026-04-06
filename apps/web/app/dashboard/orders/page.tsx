"use client";
import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { OrderStatisticsCards } from "@/components/orders-statistics-cards";
import { PageHeader } from "@/components/page-header";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Calendar,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Search,
  Tag,
} from "lucide-react";
import { OrdersList } from "@/components/orders-list";
import { useGet } from "@/hooks/use-api";
import { useGlobalFilter } from "@/contexts/global-filter-context";
import { StoreSelector } from "@/components/store-selector";
import type { Order } from "@workspace/mongodb/models/order";
import { PeriodEnum } from "@/utils/get-period";
import { format } from "date-fns";

interface OrdersResponse {
  data: Order[];
  nextToken?: string | null;
  stats: {
    totalOrders: number;
    approvedOrders: number;
    financial: { totalRevenue: number; totalProfit: number };
  } | null;
}

const ORDER_STATUSES = [
  { label: "Todos os Status", value: "all" },
  { label: "Pendente", value: "Pending" },
  { label: "Não Enviado", value: "Unshipped" },
  { label: "Enviado", value: "Shipped" },
  { label: "Entregue", value: "Delivered" },
  { label: "Cancelado", value: "Canceled" },
];

export default function OrdersPage() {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [period, setPeriod] = useState<PeriodEnum>(PeriodEnum.TODAY);

  const [tempCustomStartDate, setTempCustomStartDate] = useState("");
  const [tempCustomEndDate, setTempCustomEndDate] = useState("");
  const [tempSearchSku, setTempSearchSku] = useState("");
  const [tempSearchOrderId, setTempSearchOrderId] = useState("");
  const [tempStatus, setTempStatus] = useState("all");

  const [appliedCustomStartDate, setAppliedCustomStartDate] = useState("");
  const [appliedCustomEndDate, setAppliedCustomEndDate] = useState("");
  const [appliedSearchSku, setAppliedSearchSku] = useState("");
  const [appliedSearchOrderId, setAppliedSearchOrderId] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("all");

  const [nextToken, setNextToken] = useState<string | null>(null);
  const [previousTokens, setPreviousTokens] = useState<string[]>([]);
  const [cumulativeStats, setCumulativeStats] = useState({
    totalOrders: 0,
    approvedOrders: 0,
    totalRevenue: 0,
    totalProfit: 0,
  });

  const { selectedStoreId } = useGlobalFilter();
  const queryClient = useQueryClient();
  const pageSize = 15;

  const hasAppliedCustomPeriod = appliedCustomStartDate && appliedCustomEndDate;

  const buildApiUrl = () => {
    if (!selectedStoreId) return null;

    const params = new URLSearchParams({
      storeId: selectedStoreId,
      pageSize: pageSize.toString(),
    });

    if (hasAppliedCustomPeriod) {
      params.set("period", PeriodEnum.CUSTOM);
      params.set("startDate", appliedCustomStartDate);
      params.set("endDate", appliedCustomEndDate);
    } else {
      params.set("period", period);
    }

    if (appliedSearchSku) params.set("sku", appliedSearchSku);
    if (appliedSearchOrderId) params.set("orderId", appliedSearchOrderId);
    if (appliedStatus !== "all") params.set("orderStatus", appliedStatus);
    if (nextToken) params.set("nextToken", nextToken);

    return `/api/integrations/amazon/sp/orders?${params.toString()}`;
  };

  const apiUrl = buildApiUrl();

  const {
    data: response,
    refetch,
    isFetching,
    isLoading,
  } = useGet<OrdersResponse>(apiUrl!, {
    enabled: !!selectedStoreId,
    staleTime: 1000 * 30,
    retry: false,
  });

  const resetFilters = () => {
    setNextToken(null);
    setPreviousTokens([]);
    setCumulativeStats({
      totalOrders: 0,
      approvedOrders: 0,
      totalRevenue: 0,
      totalProfit: 0,
    });
    if (apiUrl) {
      queryClient.removeQueries({ queryKey: [apiUrl], exact: false });
    }
  };

  useEffect(() => {
    if (!selectedStoreId) return;
    resetFilters();
    refetch();
  }, [
    period,
    selectedStoreId,
    appliedCustomStartDate,
    appliedCustomEndDate,
    appliedSearchSku,
    appliedSearchOrderId,
    appliedStatus,
  ]);

  useEffect(() => {
    if (response?.stats && !nextToken) {
      setCumulativeStats({
        totalOrders: response.stats.totalOrders,
        approvedOrders: response.stats.approvedOrders,
        totalRevenue: response.stats.financial.totalRevenue,
        totalProfit: response.stats.financial.totalProfit,
      });
    }
  }, [response, nextToken]);

  const orders = useMemo(() => response?.data ?? [], [response]);

  const handleApplyFilters = () => {
    setAppliedCustomStartDate(tempCustomStartDate);
    setAppliedCustomEndDate(tempCustomEndDate);
    setAppliedSearchSku(tempSearchSku);
    setAppliedSearchOrderId(tempSearchOrderId);
    setAppliedStatus(tempStatus);
  };

  const handleClearAllFilters = () => {
    setTempCustomStartDate("");
    setTempCustomEndDate("");
    setTempSearchSku("");
    setTempSearchOrderId("");
    setTempStatus("all");
    setAppliedCustomStartDate("");
    setAppliedCustomEndDate("");
    setAppliedSearchSku("");
    setAppliedSearchOrderId("");
    setAppliedStatus("all");
    setPeriod(PeriodEnum.TODAY);
  };

  const hasActiveAdvancedFilters =
    appliedSearchSku ||
    appliedSearchOrderId ||
    hasAppliedCustomPeriod ||
    appliedStatus !== "all";

  const hasPendingChanges =
    tempCustomStartDate !== appliedCustomStartDate ||
    tempCustomEndDate !== appliedCustomEndDate ||
    tempSearchSku !== appliedSearchSku ||
    tempSearchOrderId !== appliedSearchOrderId ||
    tempStatus !== appliedStatus;

  if (!selectedStoreId) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Carregando loja selecionada...
      </p>
    );
  }

  const hasNextPage = !!response?.nextToken;
  const hasPreviousPage = previousTokens.length > 0;
  const currentPage = previousTokens.length + 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendas"
        description="Acompanhe suas vendas e performance detalhada"
      />

      <div className="p-4 rounded-lg border shadow-sm space-y-4 bg-sidebar">
        <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
          <StoreSelector />

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <Select
              value={period}
              onValueChange={(value) => setPeriod(value as PeriodEnum)}
              disabled={!!hasAppliedCustomPeriod}
            >
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PeriodEnum.TODAY}>Hoje</SelectItem>
                <SelectItem value={PeriodEnum.YESTERDAY}>Ontem</SelectItem>
                <SelectItem value={PeriodEnum.WEEK}>Últimos 7 dias</SelectItem>
                <SelectItem value={PeriodEnum.FIFTEEN_DAYS}>
                  Últimos 15 dias
                </SelectItem>
                <SelectItem value={PeriodEnum.MONTH}>
                  Últimos 30 dias
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={showAdvancedFilters ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros avançados
              {hasActiveAdvancedFilters && (
                <span className="ml-2 flex h-2 w-2 rounded-full bg-primary" />
              )}
            </Button>
          </div>
        </div>

        {showAdvancedFilters && (
          <div className="border-t pt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Filter className="h-4 w-4" />
                <span>Filtros Avançados</span>
              </div>
              {hasActiveAdvancedFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAllFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar filtros
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status do Pedido</label>
                <Select value={tempStatus} onValueChange={setTempStatus}>
                  <SelectTrigger>
                    <Tag className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar por SKU</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="SKU do produto"
                    value={tempSearchSku}
                    onChange={(e) => setTempSearchSku(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar por Pedido</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Número do pedido"
                    value={tempSearchOrderId}
                    onChange={(e) => setTempSearchOrderId(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Período customizado</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  type="date"
                  value={tempCustomStartDate}
                  onChange={(e) => setTempCustomStartDate(e.target.value)}
                  max={tempCustomEndDate || format(new Date(), "yyyy-MM-dd")}
                />
                <Input
                  type="date"
                  value={tempCustomEndDate}
                  onChange={(e) => setTempCustomEndDate(e.target.value)}
                  min={tempCustomStartDate}
                  max={format(new Date(), "yyyy-MM-dd")}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleApplyFilters}
                disabled={!hasPendingChanges}
                size="sm"
              >
                <Search className="h-4 w-4 mr-2" />
                Aplicar filtros
              </Button>
            </div>
          </div>
        )}
      </div>

      <OrderStatisticsCards
        totalPedidos={cumulativeStats.totalOrders}
        pedidosAprovados={cumulativeStats.approvedOrders}
        faturamentoTotal={cumulativeStats.totalRevenue}
        lucroTotal={cumulativeStats.totalProfit}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex items-center justify-center py-12 border rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">
            Nenhum pedido encontrado
          </p>
        </div>
      ) : (
        <>
          <OrdersList orders={orders} />
          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-sm text-muted-foreground">
              Página {currentPage}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const tokens = [...previousTokens];
                  const prev = tokens.pop() ?? "";
                  setPreviousTokens(tokens);
                  setNextToken(prev === "" ? null : prev);
                }}
                disabled={!hasPreviousPage || isFetching}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPreviousTokens((prev) => [...prev, nextToken ?? ""]);
                  setNextToken(response?.nextToken ?? null);
                }}
                disabled={!hasNextPage || isFetching}
              >
                Próxima <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
