import { startOfDay, addDays, subDays } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

export enum PeriodEnum {
  TODAY = "today",
  YESTERDAY = "yesterday",
  WEEK = "7days",
  FIFTEEN_DAYS = "15days",
  MONTH = "30days",
  CUSTOM = "custom",
}

export interface PeriodUtcRange {
  fromDateUtc: Date;
  toDateUtc: Date;
}

export function getPeriod(
  period: string | null,
  timeZone = "America/Sao_Paulo",
  referenceDate?: Date,
): PeriodUtcRange | null {
  if (!period || period === PeriodEnum.CUSTOM) {
    return null;
  }

  const now = referenceDate ?? new Date();
  const nowZoned = toZonedTime(now, timeZone);

  let startZoned: Date;
  let endZoned: Date;

  switch (period) {
    case PeriodEnum.TODAY:
      startZoned = startOfDay(nowZoned);
      endZoned = addDays(startZoned, 1);
      break;

    case PeriodEnum.YESTERDAY:
      startZoned = startOfDay(subDays(nowZoned, 1));
      endZoned = addDays(startZoned, 1);
      break;

    case PeriodEnum.WEEK:
      startZoned = startOfDay(subDays(nowZoned, 6));
      endZoned = addDays(startOfDay(nowZoned), 1);
      break;

    case PeriodEnum.FIFTEEN_DAYS:
      startZoned = startOfDay(subDays(nowZoned, 14));
      endZoned = addDays(startOfDay(nowZoned), 1);
      break;

    case PeriodEnum.MONTH:
      startZoned = startOfDay(subDays(nowZoned, 29));
      endZoned = addDays(startOfDay(nowZoned), 1);
      break;

    default:
      return null;
  }

  return {
    fromDateUtc: fromZonedTime(startZoned, timeZone),
    toDateUtc: fromZonedTime(endZoned, timeZone),
  };
}
