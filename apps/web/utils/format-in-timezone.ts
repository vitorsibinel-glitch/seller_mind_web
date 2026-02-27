import { formatInTimeZone as format } from "date-fns-tz";

export function formatInTimeZone(
  date: Date | string,
  timeZone: string,
): string {
  return format(date, timeZone, "yyyy-MM-dd HH:mm:ssXXX");
}
