import { addDays } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { getDREPeriod, DREPeriodEnum } from "@/utils/get-dre-period";

interface ResolveDREPeriodParams {
  period: DREPeriodEnum;
  startDate?: string | null;
  endDate?: string | null;
}

interface ResolveDREPeriodResult {
  fromDateUtc: Date;
  toDateUtc: Date;
}

export function resolveDREPeriodToUtc(
  params: ResolveDREPeriodParams,
): ResolveDREPeriodResult {
  const { period, startDate, endDate } = params;

  if (period === DREPeriodEnum.CUSTOM && startDate && endDate) {
    const fromDateUtc = fromZonedTime(
      `${startDate}T00:00:00`,
      "America/Sao_Paulo",
    );

    let toDateUtc = fromZonedTime(`${endDate}T00:00:00`, "America/Sao_Paulo");
    toDateUtc = addDays(toDateUtc, 1);

    return { fromDateUtc, toDateUtc };
  }

  const periodResult = getDREPeriod(period);

  if (!periodResult?.fromDateUtc || !periodResult.toDateUtc) {
    throw new Error("Período inválido");
  }

  return {
    fromDateUtc: new Date(periodResult.fromDateUtc),
    toDateUtc: new Date(periodResult.toDateUtc),
  };
}
