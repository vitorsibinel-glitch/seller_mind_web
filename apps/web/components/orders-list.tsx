"use client";

import { useMemo, useState } from "react";
import { formatDate } from "@/lib/format-date";
import { formatCurrency } from "@/utils/format-currency";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { Separator } from "@workspace/ui/components/separator";
import { cn } from "@workspace/ui/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Info,
  ShoppingCart,
  TrendingDown,
  PackageCheck,
  DollarSign,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import type { Order } from "@workspace/mongodb/models/order";
import { useGlobalFilter } from "@/contexts/global-filter-context";
import { useStores } from "@/hooks/use-stores";
import type { StoreDTO } from "@/dtos/store-dto";

interface OrdersListProps {
  orders: Order[];
  storeName?: string;
}

const getStatusConfig = (rawStatus: string) => {
  const status = (rawStatus || "").toLowerCase();
  switch (status) {
    case "shipped":
      return {
        label: "Enviado",
        bgColor: "bg-info/10",
        textColor: "text-info",
        icon: <ShoppingCart className="h-4 w-4" />,
      };
    case "canceled":
    case "cancelled":
      return {
        label: "Cancelado",
        bgColor: "bg-danger/10",
        textColor: "text-danger",
        icon: <TrendingDown className="h-4 w-4" />,
      };
    case "pending":
      return {
        label: "Pendente",
        bgColor: "bg-warning/10",
        textColor: "text-warning",
        icon: <Info className="h-4 w-4" />,
      };
    case "approved":
    case "unshipped":
    case "partiallyshipped":
    case "delivered":
      return {
        label: "Aprovado",
        bgColor: "bg-success/10",
        textColor: "text-success",
        icon: <PackageCheck className="h-4 w-4" />,
      };
    default:
      return {
        label: rawStatus || "-",
        bgColor: "bg-gray-100",
        textColor: "text-gray-800",
        icon: <Info className="h-4 w-4" />,
      };
  }
};

export function OrdersList({ orders, storeName }: OrdersListProps) {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const toggleOrderExpansion = (id: string) => {
    setExpandedOrderId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4">
      {orders.length === 0 ? (
        <div className="text-center text-muted-foreground py-6">
          Nenhum pedido encontrado.
        </div>
      ) : (
        orders.map((order) => (
          <OrderRow
            key={order.amazonOrderId}
            order={order}
            storeName={storeName}
            expanded={expandedOrderId === order.amazonOrderId}
            onToggle={() => toggleOrderExpansion(order.amazonOrderId)}
          />
        ))
      )}
    </div>
  );
}

function OrderRow({
  order,
  storeName,
  expanded,
  onToggle,
}: {
  order: Order;
  storeName?: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const items = order.items || [];
  const summary = order.financialSummary;
  const statusConfig = getStatusConfig(order.orderStatus as string);
  const { stores, isPendingStores } = useStores();
  const { selectedStoreId, handleSelectedStoreId } = useGlobalFilter();

  const selectedStore = useMemo(
    () => stores.find((s) => s._id === selectedStoreId),
    [stores, selectedStoreId],
  );

  return (
    <Collapsible
      open={expanded}
      onOpenChange={onToggle}
      className="border rounded-lg shadow-sm overflow-hidden bg-card"
    >
      <CollapsibleTrigger className="w-full text-left transition-colors hover:bg-muted/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                order.orderStatus!.toLowerCase() === "shipped"
                  ? "bg-success/10"
                  : order.orderStatus!.toLowerCase() === "canceled" ||
                      order.orderStatus!.toLowerCase() === "cancelled"
                    ? "bg-danger/10"
                    : "bg-warning/10",
              )}
            >
              {statusConfig.icon}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">
                  {formatDate(new Date(order.purchaseDate as Date))}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Badge className="bg-info/10 text-info">Amazon (FBA)</Badge>
                <span>-</span>
                <span>{selectedStore?.name}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Badge
              className={cn(
                "flex items-center",
                statusConfig.bgColor,
                statusConfig.textColor,
              )}
            >
              {statusConfig.icon}
              {statusConfig.label}
            </Badge>

            <div className="flex items-center justify-center h-8 w-8">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg"
                alt="Amazon"
                className="h-4"
              />
            </div>

            {expanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        </div>

        {!expanded && (
          <div className="px-4 pb-4">
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={`${item.asin}-${index}`}
                  className="flex items-center justify-between p-3 bg-card rounded-lg"
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <img
                      src={
                        item.productImage ||
                        "https://via.placeholder.com/96x96?text=No+Image"
                      }
                      alt={item.title || "Produto"}
                      loading="lazy"
                      className="h-12 w-12 object-cover rounded-md flex-shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {item.title || "-"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.sellerSku || "-"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-8 ml-6 flex-shrink-0">
                    <div className="text-center min-w-[60px]">
                      <div className="text-xs text-muted-foreground mb-1">
                        Qtd
                      </div>
                      <div className="text-sm font-medium">{item.quantity}</div>
                    </div>

                    <div className="text-right min-w-[80px]">
                      <div className="text-xs text-muted-foreground mb-1">
                        Total
                      </div>
                      <div className="text-sm font-medium">
                        {formatCurrency(item.itemPrice?.amount || 0)}
                      </div>
                    </div>

                    <div className="text-right min-w-[80px]">
                      <div className="text-xs text-muted-foreground mb-1">
                        Comissão
                      </div>
                      <div className="text-sm text-danger">
                        {formatCurrency(item.itemFee?.total || 0)}
                      </div>
                    </div>

                    <div className="text-right min-w-[80px]">
                      <div className="text-xs text-muted-foreground mb-1">
                        Custo
                      </div>
                      <div className="text-sm text-danger">
                        {formatCurrency(item.itemCost?.amount || 0)}
                      </div>
                    </div>

                    <div className="text-right min-w-[80px]">
                      <div className="text-xs text-muted-foreground mb-1">
                        Lucro
                      </div>
                      <div
                        className={cn(
                          "text-sm font-medium",
                          (item.itemProfit || 0) >= 0
                            ? "text-success"
                            : "text-danger",
                        )}
                      >
                        {formatCurrency(item.itemProfit || 0)}
                      </div>
                    </div>

                    <div className="text-center min-w-[80px]">
                      <div className="text-xs text-muted-foreground mb-1">
                        Margem
                      </div>
                      <Badge
                        className={cn(
                          (item.itemMargin || 0) >= 20
                            ? "bg-success/10 text-success"
                            : (item.itemMargin || 0) >= 0
                              ? "bg-warning/10 text-warning"
                              : "bg-danger/10 text-danger",
                        )}
                      >
                        {item.itemMargin && (item.itemMargin * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t">
        <div className="grid grid-cols-1 lg:grid-cols-4 lg:gap-6">
          <div className="lg:col-span-3 p-4 overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-sidebar text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 text-left">Item</th>
                  <th className="px-6 py-3 text-center">Qtd</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3 text-right">Comissão</th>
                  <th className="px-6 py-3 text-right">Imposto</th>
                  <th className="px-6 py-3 text-right">Custo</th>
                  <th className="px-6 py-3 text-right">Lucro</th>
                  <th className="px-6 py-3 text-right">Margem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted-foreground">
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-6 text-center text-muted-foreground"
                    >
                      Nenhum item encontrado.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={`${item.asin}-${index}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center max-w-[300px]">
                          <img
                            src={
                              item.productImage ||
                              "https://via.placeholder.com/96x96?text=No+Image"
                            }
                            alt={item.title || "Produto"}
                            loading="lazy"
                            className="h-12 w-12 object-cover rounded-md mr-4"
                          />

                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">
                              {item.title || "-"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.sellerSku || "-"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        {formatCurrency(item.itemPrice?.amount || 0)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        {formatCurrency(item.itemFee?.total || 0)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        {formatCurrency(summary?.totalTaxes || 0)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        {formatCurrency(item.itemCost?.amount || 0)}
                      </td>
                      <td
                        className={cn(
                          "px-6 py-4 text-right text-sm font-medium",
                          (item.itemProfit || 0) >= 0
                            ? "text-success"
                            : "text-danger",
                        )}
                      >
                        {formatCurrency(item.itemProfit || 0)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Badge
                          className={cn(
                            (item.itemMargin || 0) >= 20
                              ? "bg-success/10 text-success"
                              : (item.itemMargin || 0) >= 0
                                ? "bg-warning/10 text-warning"
                                : "bg-danger/10 text-danger",
                          )}
                        >
                          {item.itemMargin?.toFixed(2)}%
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <InfoBlock
                label="Data de criação"
                value={formatDate(new Date(order.purchaseDate as Date))}
              />
              <InfoBlock
                label="Data de aprovação"
                value={
                  order.approvalDate
                    ? formatDate(new Date(order.approvalDate))
                    : "-"
                }
              />
              <InfoBlock label="ID do pedido" value={order.amazonOrderId} />
              <InfoBlock label="ASIN" value={items[0]?.asin || "-"} />
            </div>
          </div>

          <div className="lg:col-span-1 p-4 flex flex-col border-t lg:border-t-0 lg:border-l bg-sidebar">
            <h3 className="font-medium mb-4">Resumo Financeiro</h3>

            <div className="space-y-3 flex-1">
              <div className="flex justify-between items-center py-1">
                <div className="flex items-center">
                  <DollarSign className="h-3 w-3 text-success mr-2" />
                  <span className="text-sm">Total dos itens</span>
                </div>
                <span className="text-sm font-medium text-success">
                  {formatCurrency(summary?.totalRevenue || 0)}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-sm">Total de taxas</span>
                <span className="text-sm text-danger">
                  - {formatCurrency(summary?.totalFees || 0)}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-sm">Total de impostos</span>
                <span className="text-sm text-danger">
                  - {formatCurrency(summary?.totalTaxes || 0)}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-sm">Total de custos</span>
                <span className="text-sm text-danger">
                  - {formatCurrency(summary?.totalCost || 0)}
                </span>
              </div>

              <Separator className="my-2" />

              <div className="flex justify-between items-center py-2 border-t mt-2">
                <div className="flex items-center">
                  <TrendingUp className="h-3 w-3 text-success mr-2" />
                  <span className="font-medium">Lucro do pedido</span>
                </div>
                <span className="font-medium text-success">
                  {formatCurrency(summary?.totalProfit || 0)}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={onToggle}
                >
                  {expanded ? "Ocultar" : "Ver Detalhes"}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{label}</h3>
      <div className="p-3 bg-sidebar rounded-lg text-sm text-muted-foreground">
        {value}
      </div>
    </div>
  );
}
