import {
  DollarSign,
  PackageCheck,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/utils/format-currency";
import { KpiCard, type KpiItem } from "@/components/kpi-card";

interface OrderStatisticsCardsProps {
  totalPedidos: number;
  pedidosAprovados: number;
  faturamentoTotal: number;
  lucroTotal: number;
}

export function OrderStatisticsCards({
  totalPedidos,
  pedidosAprovados,
  faturamentoTotal,
  lucroTotal,
}: OrderStatisticsCardsProps) {
  const kpis: KpiItem[] = [
    {
      title: "Total de Vendas",
      value: totalPedidos.toString(),
      icon: ShoppingCart,
      tooltip: "Quantidade total de pedidos realizados no período selecionado",
    },
    {
      title: "Vendas Aprovadas",
      value: pedidosAprovados.toString(),
      icon: PackageCheck,
      tooltip: "Pedidos com pagamento aprovado",
    },
    {
      title: "Faturamento",
      value: formatCurrency(faturamentoTotal),
      icon: DollarSign,
      tooltip: "Valor bruto faturado no período",
    },
    {
      title: "Lucro Total",
      value: formatCurrency(lucroTotal),
      icon: TrendingUp,
      tooltip: "Lucro líquido estimado após custos",
    },
  ];

  return (
    <div className="flex flex-wrap gap-4">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.title} kpi={kpi} />
      ))}
    </div>
  );
}
