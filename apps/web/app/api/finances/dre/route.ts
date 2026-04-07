import { withDB } from "@/lib/mongoose";
<<<<<<< HEAD
=======
import { requireSubscription } from "@/lib/require-subscription";
>>>>>>> origin/feat/fases-1-4
import { validateStoreFromRequest } from "@/lib/validate-store-from-request";
import { OrderModel } from "@workspace/mongodb/models/order";
import { NextResponse } from "next/server";
import { DREPeriodEnum } from "@/utils/get-dre-period";
import { resolveDREPeriodToUtc } from "@/utils/resolve-dre-period-to-utc";
import { ExpenseModel } from "@workspace/mongodb/models/expense";
import { getCompletedAdsReport } from "@/services/ads-report-service";

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
  resultadoFinanceiro: DRELine[];
  resultado: DRELine[];
  netMargin: number;
}

async function calculateDRE(
  storeId: string,
  fromDateUtc: Date,
  toDateUtc: Date,
): Promise<DREData> {
  const allOrders = await OrderModel.find({
    storeId,
    purchaseDate: {
      $gte: fromDateUtc,
      $lte: toDateUtc,
    },
  }).lean();

  const EXCLUDED_STATUSES = ["Canceled", "Refunded"];

  const nonCanceledOrders = allOrders.filter(
    (o) => !EXCLUDED_STATUSES.includes(o.orderStatus || ""),
  );

  let grossRevenue = 0;
  let totalTaxes = 0;
  let totalFees = 0;
  let totalCosts = 0;
  let totalProfitFromOrders = 0;

  for (const order of nonCanceledOrders) {
    const summary = order.financialSummary;
    if (summary) {
      grossRevenue += summary.totalRevenue || 0;
      totalTaxes += summary.totalTaxes || 0;
      totalFees += summary.totalFees || 0;
      totalCosts += summary.totalCost || 0;
      totalProfitFromOrders += summary.totalProfit || 0;
    }
  }

  const returnedOrders = allOrders.filter((order) =>
    ["Refunded", "Returned"].includes(order.orderStatus || ""),
  );

  let totalReturns = 0;
  for (const order of returnedOrders) {
    totalReturns += order.financialSummary?.totalRevenue || 0;
  }

  const adsReportResult = await getCompletedAdsReport(
    storeId,
    fromDateUtc,
    toDateUtc,
  );

  const advertisingCosts = adsReportResult.aggregated?.cost || 0;

  const expenses = await ExpenseModel.find({
    storeId,
    dueDate: { $gte: fromDateUtc, $lt: toDateUtc },
  }).lean();

  const expenseSums = expenses.reduce<Record<string, number>>((acc, e) => {
    const key = e.category || "other";
    acc[key] = (acc[key] || 0) + (e.amount || 0);
    return acc;
  }, {});

  const rentExpenses = expenseSums["rent"] || 0;
  const salaryExpenses = expenseSums["salary"] || 0;
  const utilitiesExpenses = expenseSums["utilities"] || 0;
  const suppliesExpenses = expenseSums["supplies"] || 0;
  const maintenanceExpenses = expenseSums["maintenance"] || 0;
  const servicesExpenses = expenseSums["services"] || 0;
  const taxesPaidExpenses = expenseSums["taxes"] || 0;
  const freightExpenses = expenseSums["freight"] || 0;
  const otherExpenses = expenseSums["other"] || 0;

  const revenueDeductions = totalTaxes + totalReturns + totalFees;
  const netRevenue = grossRevenue - revenueDeductions;

  const cogs = totalCosts + advertisingCosts;
  const operatingCosts = cogs;

  const grossProfit = netRevenue - operatingCosts;

  const operatingExpenses =
    rentExpenses +
    salaryExpenses +
    utilitiesExpenses +
    suppliesExpenses +
    maintenanceExpenses +
    servicesExpenses +
    freightExpenses +
    otherExpenses;

  const financialRevenue = 0;
  const financialExpenses = 0;
  const financialResult = financialRevenue - financialExpenses;

  const netProfit =
    totalProfitFromOrders - advertisingCosts - operatingExpenses;

  const netMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

  return {
    receitas: [
      { descricao: "Receita Bruta de Vendas", valor: grossRevenue },
      { descricao: "(-) Deduções da Receita Bruta", valor: -revenueDeductions },
      { descricao: "Impostos sobre Vendas", valor: -totalTaxes, nivel: 1 },
      {
        descricao: "Devoluções e Cancelamentos",
        valor: -totalReturns,
        nivel: 1,
      },
      { descricao: "Taxas de Marketplace", valor: -totalFees, nivel: 1 },
      { descricao: "(=) Receita Líquida", valor: netRevenue, destaque: true },
    ],
    custos: [
      { descricao: "(-) Custos Operacionais", valor: -operatingCosts },
      {
        descricao: "Custo das Mercadorias Vendidas (CMV)",
        valor: -totalCosts,
        nivel: 1,
      },
      {
        descricao: "Publicidade e Marketing (ADS)",
        valor: -advertisingCosts,
        nivel: 1,
      },
      { descricao: "(=) Lucro Bruto", valor: grossProfit, destaque: true },
    ],
    despesas: [
      { descricao: "(-) Despesas Operacionais", valor: -operatingExpenses },
      { descricao: "Aluguel", valor: -rentExpenses, nivel: 1 },
      { descricao: "Salários e Encargos", valor: -salaryExpenses, nivel: 1 },
      {
        descricao: "Utilidades (água, luz, internet)",
        valor: -utilitiesExpenses,
        nivel: 1,
      },
      {
        descricao: "Materiais e Suprimentos",
        valor: -suppliesExpenses,
        nivel: 1,
      },
      { descricao: "Manutenção", valor: -maintenanceExpenses, nivel: 1 },
      {
        descricao: "Serviços Terceirizados",
        valor: -servicesExpenses,
        nivel: 1,
      },
      { descricao: "Frete", valor: -freightExpenses, nivel: 1 },
      { descricao: "Outras Despesas", valor: -otherExpenses, nivel: 1 },
    ],
    resultadoFinanceiro: [
      { descricao: "(+/-) Resultado Financeiro", valor: financialResult },
      { descricao: "Receitas Financeiras", valor: financialRevenue, nivel: 1 },
      {
        descricao: "Despesas Financeiras",
        valor: -financialExpenses,
        nivel: 1,
      },
    ],
    resultado: [
      {
        descricao: "(=) Lucro Líquido do Exercício",
        valor: netProfit,
        destaque: true,
        final: true,
      },
    ],
    netMargin,
  };
}

export async function GET(req: Request): Promise<NextResponse> {
  return withDB(async () => {
    const url = new URL(req.url);
    const period = (url.searchParams.get("period") ||
      DREPeriodEnum.CURRENT_MONTH) as DREPeriodEnum;
    const startDate = url.searchParams.get("startDate") || null;
    const endDate = url.searchParams.get("endDate") || null;

<<<<<<< HEAD
    const { store } = await validateStoreFromRequest(req);
=======
    const { store, userId } = await validateStoreFromRequest(req);
    const denied = await requireSubscription(userId);
    if (denied) return denied;
>>>>>>> origin/feat/fases-1-4

    const { fromDateUtc, toDateUtc } = resolveDREPeriodToUtc({
      period,
      startDate,
      endDate,
    });

    const dreData = await calculateDRE(
      store._id.toString(),
      fromDateUtc,
      toDateUtc,
    );

    return NextResponse.json(dreData);
  });
}
