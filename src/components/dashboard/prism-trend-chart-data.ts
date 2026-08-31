import type { DataPoint } from "@/lib/analytics/query-engine";

export type PrismTrendChartSeries = {
  data: readonly { x: string; y: number | null }[];
  id: "현재 기간" | "비교 기간";
};

export function createPrismTrendChartSeries(
  points: readonly DataPoint[],
): readonly PrismTrendChartSeries[] {
  const currentPeriod: PrismTrendChartSeries = {
    data: points.map((point) => ({ x: point.label, y: point.value })),
    id: "현재 기간",
  };
  const comparisonPeriod: PrismTrendChartSeries = {
    data: points.map((point) => ({
      x: point.label,
      y: point.previousValue ?? null,
    })),
    id: "비교 기간",
  };

  return points.some((point) => point.previousValue !== undefined)
    ? [currentPeriod, comparisonPeriod]
    : [currentPeriod];
}

export function getPrismTrendTickValues(
  points: readonly DataPoint[],
): readonly string[] {
  const labels = points.map((point) => point.label);

  if (labels.length <= 3) {
    return labels;
  }

  const firstLabel = labels[0];
  const middleLabel = labels[Math.floor(labels.length / 2)];
  const lastLabel = labels.at(-1);

  if (!firstLabel || !middleLabel || !lastLabel) {
    return [];
  }

  return [...new Set([firstLabel, middleLabel, lastLabel])];
}
