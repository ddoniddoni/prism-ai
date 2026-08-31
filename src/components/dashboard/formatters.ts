import type { MetricKey } from "@/lib/analytics/metric-catalog";
import type { CompareMode } from "@/lib/analytics/query-schema";

const currencyFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

const countFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 0,
});

export function formatMetricValue(
  metric: MetricKey,
  value: number | null | undefined,
): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (
    metric === "revenue" ||
    metric === "averageOrderValue" ||
    metric === "adSpend"
  ) {
    return currencyFormatter.format(value);
  }

  if (metric === "conversionRate" || metric === "refundRate") {
    return `${value.toFixed(1)}%`;
  }

  if (metric === "roas") {
    return `${value.toFixed(2)}×`;
  }

  return countFormatter.format(value);
}

export function formatChange(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "비교 불가";
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function getComparisonLabel(compareWith: CompareMode): string {
  const labels: Record<CompareMode, string> = {
    none: "비교 없음",
    previousPeriod: "이전 기간 대비",
    previousMonth: "이전 달 대비",
    previousYear: "전년 동기 대비",
  };

  return labels[compareWith];
}
