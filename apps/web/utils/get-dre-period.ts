import {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
} from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

export enum DREPeriodEnum {
  CURRENT_MONTH = "current_month",
  LAST_MONTH = "last_month",
  LAST_3_MONTHS = "last_3_months",
  CURRENT_YEAR = "current_year",
  LAST_YEAR = "last_year",
  CUSTOM = "custom",
}

export interface PeriodUtcRange {
  fromDateUtc: Date;
  toDateUtc: Date;
}

export function getDREPeriod(
  period: string | null,
  timeZone = "America/Sao_Paulo",
  referenceDate?: Date,
): PeriodUtcRange | null {
  if (!period || period === DREPeriodEnum.CUSTOM) {
    return null;
  }

  const now = referenceDate ?? new Date();
  const nowZoned = toZonedTime(now, timeZone);

  let startZoned: Date;
  let endZoned: Date;

  switch (period) {
    case DREPeriodEnum.CURRENT_MONTH:
      startZoned = startOfMonth(nowZoned);
      endZoned = endOfMonth(nowZoned);
      break;

    case DREPeriodEnum.LAST_MONTH:
      const lastMonth = subMonths(nowZoned, 1);
      startZoned = startOfMonth(lastMonth);
      endZoned = endOfMonth(lastMonth);
      break;

    case DREPeriodEnum.LAST_3_MONTHS:
      startZoned = startOfMonth(subMonths(nowZoned, 2));
      endZoned = endOfMonth(nowZoned);
      break;

    case DREPeriodEnum.CURRENT_YEAR:
      startZoned = startOfYear(nowZoned);
      endZoned = endOfYear(nowZoned);
      break;

    case DREPeriodEnum.LAST_YEAR:
      startZoned = startOfYear(nowZoned);
      endZoned = endOfMonth(nowZoned);
      break;

    default:
      return null;
  }

  return {
    fromDateUtc: fromZonedTime(startZoned, timeZone),
    toDateUtc: fromZonedTime(endZoned, timeZone),
  };
}
