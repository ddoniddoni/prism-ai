import type { MetricKey } from "@/lib/analytics/metric-catalog";
import { metricCatalog } from "@/lib/analytics/metric-catalog";
import type { AnalyticsDataset, DataPoint } from "@/lib/analytics/query-engine";

export type DashboardDrilldownSelection = {
  label: string;
  queryId: string;
  widgetId: string;
};

export type DashboardDrilldown = {
  averageValue: number | null;
  comparison: {
    absoluteChange: number | null;
    percentChange: number | null;
    previousValue: number | null;
  } | null;
  dataset: AnalyticsDataset;
  metric: MetricKey;
  point: DataPoint;
  rank: number | null;
  sharePercent: number | null;
  validPointCount: number;
};

function getRank(
  points: readonly DataPoint[],
  selectedPoint: DataPoint,
): { rank: number | null; validPointCount: number } {
  if (selectedPoint.value === null) {
    return { rank: null, validPointCount: 0 };
  }

  const rankedPoints = points
    .filter(
      (point): point is DataPoint & { value: number } => point.value !== null,
    )
    .toSorted(
      (left, right) =>
        right.value - left.value || left.label.localeCompare(right.label),
    );
  const rank = rankedPoints.findIndex(
    (point) => point.label === selectedPoint.label,
  );

  return {
    rank: rank === -1 ? null : rank + 1,
    validPointCount: rankedPoints.length,
  };
}

function getAverageValue(points: readonly DataPoint[]): number | null {
  const values = points.flatMap((point) =>
    point.value === null ? [] : [point.value],
  );

  if (values.length === 0) {
    return null;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function getSharePercent(
  dataset: AnalyticsDataset,
  selectedPoint: DataPoint,
): number | null {
  if (
    !dataset.groupBy ||
    dataset.groupBy === "date" ||
    metricCatalog[dataset.metric].aggregation !== "sum" ||
    dataset.currentTotal === null ||
    dataset.currentTotal === 0 ||
    selectedPoint.value === null
  ) {
    return null;
  }

  return (selectedPoint.value / dataset.currentTotal) * 100;
}

export function createDashboardDrilldown(
  dataset: AnalyticsDataset,
  label: string,
): DashboardDrilldown | undefined {
  const point = dataset.points.find((candidate) => candidate.label === label);

  if (!point) {
    return undefined;
  }

  const { rank, validPointCount } = getRank(dataset.points, point);
  const hasComparison = point.previousValue !== undefined;

  return {
    averageValue: getAverageValue(dataset.points),
    comparison: hasComparison
      ? {
          absoluteChange: point.absoluteChange ?? null,
          percentChange: point.percentChange ?? null,
          previousValue: point.previousValue ?? null,
        }
      : null,
    dataset,
    metric: dataset.metric,
    point,
    rank,
    sharePercent: getSharePercent(dataset, point),
    validPointCount,
  };
}
