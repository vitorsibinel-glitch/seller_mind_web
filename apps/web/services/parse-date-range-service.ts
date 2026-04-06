import { fromZonedTime } from "date-fns-tz";
import { getPeriod, PeriodEnum } from "@/utils/get-period";

const TIMEZONE = "America/Sao_Paulo";

export interface DateRange {
  fromDateUtc: Date;
  toDateUtc: Date;
}

export function parseDateRange(
  period: string | null,
  startDate: string | null,
  endDate: string | null,
): DateRange | null {
  if (period === PeriodEnum.CUSTOM && startDate && endDate) {
    return {
      fromDateUtc: fromZonedTime(`${startDate} 00:00:00`, TIMEZONE),
      toDateUtc: fromZonedTime(`${endDate} 23:59:59.999`, TIMEZONE),
    };
  }

  const periodResult = getPeriod(period);
  if (!periodResult?.fromDateUtc || !periodResult?.toDateUtc) {
    return null;
  }

  return {
    fromDateUtc: periodResult.fromDateUtc,
    toDateUtc: periodResult.toDateUtc,
  };
}
