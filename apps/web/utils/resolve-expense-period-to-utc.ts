import { addDays } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { ExpensePeriodEnum, getExpensePeriod } from "./get-expense-period";

interface ResolveExpensePeriodParams {
  period: ExpensePeriodEnum;
  startDate?: string | null;
  endDate?: string | null;
}

interface ResolveDREPeriodResult {
  fromDateUtc: Date;
  toDateUtc: Date;
}

export function resolveExpensePeriodToUtc(
  params: ResolveExpensePeriodParams,
): ResolveDREPeriodResult {
  const { period, startDate, endDate } = params;

  if (period === ExpensePeriodEnum.CUSTOM && startDate && endDate) {
    const fromDateUtc = fromZonedTime(
      `${startDate}T00:00:00`,
      "America/Sao_Paulo",
    );

    let toDateUtc = fromZonedTime(`${endDate}T00:00:00`, "America/Sao_Paulo");

    toDateUtc = addDays(toDateUtc, 1);

    return { fromDateUtc, toDateUtc };
  }

  const periodResult = getExpensePeriod(period);

  if (!periodResult?.fromDateUtc || !periodResult.toDateUtc) {
    throw new Error("Período inválido");
  }

  return {
    fromDateUtc: new Date(periodResult.fromDateUtc),
    toDateUtc: new Date(periodResult.toDateUtc),
  };
}
