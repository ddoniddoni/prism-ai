import { z } from "zod";

import { dimensionCatalog, dimensionKeys } from "./dimension-catalog";
import { metricCatalog, metricKeys, type MetricKey } from "./metric-catalog";
import type { AnalyticsDataset, DataPoint } from "./query-engine";
import {
  calculateAbsoluteChange,
  calculatePercentChange,
  detectAnomalies,
  findTopDrivers,
} from "./statistics";

export const findingTypes = [
  "trend",
  "driver",
  "anomaly",
  "ranking",
  "dataQuality",
] as const;

export const findingSeverities = [
  "info",
  "positive",
  "warning",
  "critical",
] as const;

export const findingSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(findingTypes),
    severity: z.enum(findingSeverities),
    metric: z.enum(metricKeys),
    dimension: z.enum(dimensionKeys).optional(),
    segment: z.string().min(1).optional(),
    currentValue: z.number().finite().nullable().optional(),
    previousValue: z.number().finite().nullable().optional(),
    absoluteChange: z.number().finite().nullable().optional(),
    percentChange: z.number().finite().nullable().optional(),
    contributionPercent: z.number().finite().nullable().optional(),
    evidenceQueryIds: z.array(z.string().min(1)).min(1),
    fallbackText: z.string().min(1),
  })
  .strict();

export type Finding = z.infer<typeof findingSchema>;

function toFindingId(
  queryId: string,
  type: (typeof findingTypes)[number],
  index = 0,
): string {
  return `finding-${encodeURIComponent(queryId)}-${type}-${index}`;
}

function formatPercent(value: number): string {
  return `${Math.abs(value).toFixed(1)}%`;
}

function getTrendSeverity(percentChange: number | null): Finding["severity"] {
  if (percentChange === null) {
    return "info";
  }

  if (percentChange >= 0) {
    return "positive";
  }

  return percentChange <= -20 ? "critical" : "warning";
}

function getTrendText(metric: MetricKey, percentChange: number | null): string {
  const label = metricCatalog[metric].label;

  if (percentChange === null) {
    return `${label}의 비교 기준값이 0이거나 없어 증감률을 계산할 수 없습니다.`;
  }

  const direction = percentChange >= 0 ? "증가" : "감소";

  return `${label}은 이전 비교 기간 대비 ${formatPercent(percentChange)} ${direction}했습니다.`;
}

function buildDataQualityFinding(
  dataset: AnalyticsDataset,
): Finding | undefined {
  const warning = dataset.warnings[0];

  if (!warning) {
    return undefined;
  }

  return {
    id: toFindingId(dataset.queryId, "dataQuality"),
    type: "dataQuality",
    severity: "warning",
    metric: dataset.metric,
    ...(dataset.groupBy ? { dimension: dataset.groupBy } : {}),
    evidenceQueryIds: [dataset.queryId],
    fallbackText: warning,
  };
}

function buildTrendFinding(dataset: AnalyticsDataset): Finding | undefined {
  if (dataset.previousTotal === undefined) {
    return undefined;
  }

  const absoluteChange = calculateAbsoluteChange(
    dataset.currentTotal,
    dataset.previousTotal,
  );
  const percentChange = calculatePercentChange(
    dataset.currentTotal,
    dataset.previousTotal,
  );

  if (absoluteChange === null) {
    return undefined;
  }

  return {
    id: toFindingId(dataset.queryId, "trend"),
    type: "trend",
    severity: getTrendSeverity(percentChange),
    metric: dataset.metric,
    currentValue: dataset.currentTotal,
    previousValue: dataset.previousTotal,
    absoluteChange,
    percentChange,
    evidenceQueryIds: [dataset.queryId],
    fallbackText: getTrendText(dataset.metric, percentChange),
  };
}

function buildDriverFindings(dataset: AnalyticsDataset): Finding[] {
  if (!dataset.groupBy || dataset.previousTotal === undefined) {
    return [];
  }

  const drivers = findTopDrivers(
    dataset.points.map((point) => ({
      label: point.label,
      currentValue: point.value,
      previousValue: point.previousValue ?? null,
    })),
    dataset.currentTotal,
    dataset.previousTotal,
  );
  const totalChange = calculateAbsoluteChange(
    dataset.currentTotal,
    dataset.previousTotal,
  );

  if (totalChange === null) {
    return [];
  }

  const direction = totalChange >= 0 ? "증가" : "감소";
  const dimensionLabel = dimensionCatalog[dataset.groupBy].label;

  return drivers.map((driver, index): Finding => ({
    id: toFindingId(dataset.queryId, "driver", index),
    type: "driver",
    severity: getTrendSeverity(
      calculatePercentChange(driver.currentValue, driver.previousValue),
    ),
    metric: dataset.metric,
    dimension: dataset.groupBy,
    segment: driver.label,
    currentValue: driver.currentValue,
    previousValue: driver.previousValue,
    absoluteChange: driver.absoluteChange,
    percentChange: calculatePercentChange(
      driver.currentValue,
      driver.previousValue,
    ),
    contributionPercent: driver.contributionPercent,
    evidenceQueryIds: [dataset.queryId],
    fallbackText: `${dimensionLabel} ${driver.label}은 전체 ${metricCatalog[dataset.metric].label} ${direction}의 ${formatPercent(driver.contributionPercent)}를 차지한 주요 기여 항목입니다.`,
  }));
}

function buildRankingFinding(dataset: AnalyticsDataset): Finding | undefined {
  if (!dataset.groupBy || dataset.previousTotal !== undefined) {
    return undefined;
  }

  const ranked = [...dataset.points]
    .filter(
      (point): point is DataPoint & { value: number } => point.value !== null,
    )
    .sort(
      (left, right) =>
        right.value - left.value || left.label.localeCompare(right.label),
    );
  const leader = ranked[0];

  if (!leader) {
    return undefined;
  }

  return {
    id: toFindingId(dataset.queryId, "ranking"),
    type: "ranking",
    severity: "info",
    metric: dataset.metric,
    dimension: dataset.groupBy,
    segment: leader.label,
    currentValue: leader.value,
    evidenceQueryIds: [dataset.queryId],
    fallbackText: `${dimensionCatalog[dataset.groupBy].label} 기준으로 ${leader.label}이(가) 가장 높은 ${metricCatalog[dataset.metric].label}을 기록했습니다.`,
  };
}

function buildAnomalyFindings(dataset: AnalyticsDataset): Finding[] {
  if (dataset.groupBy !== "date") {
    return [];
  }

  return detectAnomalies(dataset.points).map((anomaly, index): Finding => ({
    id: toFindingId(dataset.queryId, "anomaly", index),
    type: "anomaly",
    severity: "warning",
    metric: dataset.metric,
    dimension: "date",
    segment: anomaly.label,
    currentValue: anomaly.value,
    evidenceQueryIds: [dataset.queryId],
    fallbackText: `${anomaly.label}의 ${metricCatalog[dataset.metric].label}은 최근 관측치 대비 평소 범위에서 크게 벗어났습니다.`,
  }));
}

export function buildFindings(
  datasets: readonly AnalyticsDataset[],
): Finding[] {
  return datasets.flatMap((dataset) => {
    const dataQualityFinding = buildDataQualityFinding(dataset);
    const trendFinding = buildTrendFinding(dataset);
    const driverFindings = buildDriverFindings(dataset);
    const rankingFinding = buildRankingFinding(dataset);
    const anomalyFindings = buildAnomalyFindings(dataset);

    return [
      ...(dataQualityFinding ? [dataQualityFinding] : []),
      ...(trendFinding ? [trendFinding] : []),
      ...driverFindings,
      ...(rankingFinding ? [rankingFinding] : []),
      ...anomalyFindings,
    ];
  });
}
