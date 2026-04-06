import { addDays } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { getPeriod, PeriodEnum } from "@/utils/get-period";

interface ResolvePeriodParams {
  period: PeriodEnum;
  startDate?: string | null;
  endDate?: string | null;
}

interface ResolvePeriodResult {
  fromDateUtc: Date;
  toDateUtc: Date;
}

export function resolvePeriodToUtc(
  params: ResolvePeriodParams,
): ResolvePeriodResult {
  const { period, startDate, endDate } = params;

  if (period === PeriodEnum.CUSTOM && startDate && endDate) {
    const fromDateUtc = fromZonedTime(
      `${startDate}T00:00:00`,
      "America/Sao_Paulo",
    );

    let toDateUtc = fromZonedTime(`${endDate}T00:00:00`, "America/Sao_Paulo");

    toDateUtc = addDays(toDateUtc, 1);

    return { fromDateUtc, toDateUtc };
  }

  const periodResult = getPeriod(period);

  if (!periodResult?.fromDateUtc || !periodResult.toDateUtc) {
    throw new Error("Periodo inválido");
  }

  return {
    fromDateUtc: new Date(periodResult.fromDateUtc),
    toDateUtc: new Date(periodResult.toDateUtc),
  };
}
