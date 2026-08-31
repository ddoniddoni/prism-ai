import type { AnalyticsDataRange } from "@/lib/data/repository";

function formatIsoDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${year}.${month}.${day}`;
}

export function formatDataRange({ minDate, maxDate }: AnalyticsDataRange) {
  return `${formatIsoDate(minDate)} — ${formatIsoDate(maxDate)}`;
}
