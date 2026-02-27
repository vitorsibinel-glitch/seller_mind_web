import { formatCurrency } from "@/utils/format-currency";
import { getDaysColor } from "@/utils/get-days-color";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  DollarSign,
  BarChart,
  Percent,
  ShoppingCart,
  Package,
  TrendingUp,
  Activity,
  Calendar,
} from "lucide-react";
import type { JSX } from "react";
import { KpiCard, KpiItem } from "@/components/kpi-card";

type Stats = {
  totalOrders: number;
  approvedOrders: number;
  totalUnitsQuantity: number;
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  netMarketplace: number;
  ticketAverageNet: number;
  adsCost: number;
  tacos: number;
  roi: number;
  profitAfterAds: number;
  marginAfterAds: number;
};

interface SectionCardsProps {
  stats: Stats;
  isCalculating: boolean;
}

export function SectionCards({ stats, isCalculating }: SectionCardsProps) {
  const hasAdsData = stats.adsCost > 0;

  const formatCurrencyOrDash = (n: number) =>
    !hasAdsData ? "-" : formatCurrency(n);
  const formatPercentOrDash = (n: number) => (!hasAdsData ? "-" : n.toFixed(2));

  const kpiIconCardColor = "bg-primary/40 text-primary";

  const kpis: KpiItem[] = [
    {
      title: "Faturamento",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      iconBgColor: kpiIconCardColor,
      tooltip: "Valor total faturado no período",
      description: "Receita total no período",
    },
    {
      title: "Líq. do Marketplace",
      value: formatCurrency(stats.netMarketplace),
      icon: DollarSign,
      iconBgColor: kpiIconCardColor,
      tooltip: "Valor líquido após taxas",
      description: "Receita líquida após taxas",
    },
    {
      title: "Lucro Bruto",
      value: formatCurrency(stats.totalProfit),
      icon: BarChart,
      iconBgColor: kpiIconCardColor,
      tooltip: "Lucro Bruto total",
      description: "Lucro bruto total",
    },
    {
      title: "Margem",
      value: stats.profitMargin.toFixed(2),
      suffix: "%",
      icon: Percent,
      iconBgColor: kpiIconCardColor,
      tooltip: "Margem percentual",
      description: "Margem sobre faturamento",
    },
    {
      title: "Número de Vendas",
      value: String(stats.totalOrders),
      icon: ShoppingCart,
      iconBgColor: kpiIconCardColor,
      tooltip: "Total de pedidos",
      description: "Total de pedidos",
    },
    {
      title: "Número de Unidades Vendidas",
      value: String(stats.totalUnitsQuantity),
      icon: Package,
      iconBgColor: kpiIconCardColor,
      tooltip: "Total de unidades vendidas",
      description: "Unidades vendidas",
    },
    {
      title: "Ticket Médio",
      value: formatCurrency(stats.ticketAverageNet),
      icon: DollarSign,
      iconBgColor: kpiIconCardColor,
      tooltip: "Valor médio por pedido",
      description: "Ticket médio",
    },
    {
      title: "Retorno Sobre Investimento",
      value: formatPercentOrDash(stats.roi),
      suffix: hasAdsData ? "%" : "",
      icon: TrendingUp,
      iconBgColor: kpiIconCardColor,
      tooltip: "ROI com base nos anúncios",
      description: "Retorno sobre investimento",
    },
    {
      title: "Valor em Ads",
      value: formatCurrencyOrDash(stats.adsCost),
      icon: Activity,
      iconBgColor: kpiIconCardColor,
      tooltip: "Total investido em anúncios",
      description: "Investimento em Ads",
    },
    {
      title: "TACOS",
      value: formatPercentOrDash(stats.tacos),
      suffix: hasAdsData ? "%" : "",
      icon: Percent,
      iconBgColor: kpiIconCardColor,
      tooltip: "Custo de Ads sobre o total de vendas",
      description: "Custo total de publicidade das vendas",
    },
    {
      title: "Lucro Pós ADS",
      value: formatCurrencyOrDash(stats.profitAfterAds),
      icon: BarChart,
      iconBgColor: kpiIconCardColor,
      tooltip: "Lucro após descontar Ads",
      description: "Lucro líquido pós Ads",
    },
    {
      title: "MPA",
      value: formatPercentOrDash(stats.marginAfterAds),
      suffix: hasAdsData ? "%" : "",
      icon: Percent,
      iconBgColor: kpiIconCardColor,
      tooltip: "Margem pós anúncios",
      description: "Margem pós Ads",
    },
  ];

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {isCalculating
        ? Array.from({ length: 12 }).map((_, i) => (
            <Card key={i} className="@container/card py-4">
              <CardHeader className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-7 w-32" />
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <Skeleton className="h-4 w-40" />
              </CardFooter>
            </Card>
          ))
        : kpis.map((kpi) => (
            <KpiCard
              key={kpi.title}
              kpi={kpi}
              className="@container/card py-4"
            />
          ))}
    </div>
  );
}
