"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  ChartContainer,
  type ChartConfig,
} from "@workspace/ui/components/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

// Dados para os últimos 3 meses (90 dias)
const generateChartData = () => {
  const data = [];
  const today = new Date();

  for (let i = 89; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const day = date.getDate();
    const month = date.toLocaleDateString("pt-BR", { month: "short" });

    // Gera valores aleatórios mas consistentes
    const faturamento = Math.floor(150 + Math.random() * 150);
    const liquidoMarketplace = Math.floor(faturamento * 0.7);
    const lucroBruto = Math.floor(faturamento * 0.2);

    data.push({
      date: date.toISOString().split("T")[0],
      name: `${day} ${month}`,
      faturamento,
      liquidoMarketplace,
      lucroBruto,
    });
  }

  return data;
};

const allChartData = generateChartData();

const chartConfig = {
  faturamento: {
    label: "Faturamento",
    color: "#8884d8",
  },
  liquidoMarketplace: {
    label: "Líquido Marketplace",
    color: "#82ca9d",
  },
  lucroBruto: {
    label: "Lucro Bruto",
    color: "#ffc658",
  },
} satisfies ChartConfig;

export function ChartAreaInteractive() {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("90d");

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
  }, [isMobile]);

  const filteredData = React.useMemo(() => {
    let days = 90;
    if (timeRange === "30d") {
      days = 30;
    } else if (timeRange === "7d") {
      days = 7;
    }

    return allChartData.slice(-days);
  }, [timeRange]);

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Resumo de Receitas</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {timeRange === "90d" && "Total para os últimos 3 meses"}
            {timeRange === "30d" && "Total para os últimos 30 dias"}
            {timeRange === "7d" && "Total para os últimos 7 dias"}
          </span>
          <span className="@[540px]/card:hidden">
            {timeRange === "90d" && "Últimos 3 meses"}
            {timeRange === "30d" && "Últimos 30 dias"}
            {timeRange === "7d" && "Últimos 7 dias"}
          </span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Últimos 3 meses</ToggleGroupItem>
            <ToggleGroupItem value="30d">Últimos 30 dias</ToggleGroupItem>
            <ToggleGroupItem value="7d">Últimos 7 dias</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Últimos 3 meses" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Últimos 3 meses
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Últimos 30 dias
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Últimos 7 dias
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient
                id="colorLiquidoMarketplace"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorLucroBruto" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffc658" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ffc658" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="faturamento"
              name="Faturamento"
              stroke="#8884d8"
              fillOpacity={1}
              fill="url(#colorFaturamento)"
            />
            <Area
              type="monotone"
              dataKey="liquidoMarketplace"
              name="Líquido Marketplace"
              stroke="#82ca9d"
              fillOpacity={1}
              fill="url(#colorLiquidoMarketplace)"
            />
            <Area
              type="monotone"
              dataKey="lucroBruto"
              name="Lucro Bruto"
              stroke="#ffc658"
              fillOpacity={1}
              fill="url(#colorLucroBruto)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
