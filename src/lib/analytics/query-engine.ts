import { z } from "zod";

import type { AnalyticsDailyRow } from "@/lib/data/repository";

import { dimensionKeys } from "./dimension-catalog";
import { metricCatalog, metricKeys, type MetricKey } from "./metric-catalog";
import {
  resolveComparisonPeriod,
  resolvePeriod,
  type ResolvedPeriod,
} from "./period";
import {
  analyticsQuerySchema,
  normalizeAnalyticsQuery,
  type AnalyticsFilter,
  type AnalyticsQuery,
} from "./query-schema";
import {
  calculateAbsoluteChange,
  calculatePercentChange,
  calculateRanking,
} from "./statistics";

export const dataPointSchema = z
  .object({
    label: z.string().min(1),
    value: z.number().finite().nullable(),
    previousValue: z.number().finite().nullable().optional(),
    absoluteChange: z.number().finite().nullable().optional(),
    percentChange: z.number().finite().nullable().optional(),
  })
  .strict();

const resolvedPeriodSchema = z
  .object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .strict();

export const analyticsDatasetSchema = z
  .object({
    queryId: z.string().min(1),
    metric: z.enum(metricKeys),
    groupBy: z.enum(dimensionKeys).optional(),
    currentTotal: z.number().finite().nullable(),
    previousTotal: z.number().finite().nullable().optional(),
    points: z.array(dataPointSchema),
    dataRange: resolvedPeriodSchema,
    comparisonRange: resolvedPeriodSchema.optional(),
    empty: z.boolean(),
    warnings: z.array(z.string().min(1)),
  })
  .strict();

export type DataPoint = z.infer<typeof dataPointSchema>;
export type AnalyticsDataset = z.infer<typeof analyticsDatasetSchema>;

type QueryEngineDataRange = {
  minDate: string;
  maxDate: string;
};

type GroupedValues = ReadonlyMap<string, number | null>;

function isWithinPeriod(
  row: AnalyticsDailyRow,
  period: ResolvedPeriod,
): boolean {
  return row.date >= period.startDate && row.date <= period.endDate;
}

function matchesFilter(
  row: AnalyticsDailyRow,
  filter: AnalyticsFilter,
): boolean {
  const rowValue = row[filter.dimension];
  const matches = rowValue !== null && filter.values.includes(rowValue);

  if (filter.operator === "notIn") {
    return !matches;
  }

  return matches;
}

export function applyAnalyticsFilters(
  rows: readonly AnalyticsDailyRow[],
  filters: readonly AnalyticsFilter[],
): AnalyticsDailyRow[] {
  return rows.filter((row) =>
    filters.every((filter) => matchesFilter(row, filter)),
  );
}

function sumBy(
  rows: readonly AnalyticsDailyRow[],
  field:
    | "revenue"
    | "orders"
    | "unitsSold"
    | "customers"
    | "sessions"
    | "adSpend"
    | "attributedRevenue"
    | "refunds",
): number {
  return rows.reduce((total, row) => total + row[field], 0);
}

function divideOrNull(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : numerator / denominator;
}

export function calculateMetricValue(
  metric: MetricKey,
  rows: readonly AnalyticsDailyRow[],
): number | null {
  if (rows.length === 0) {
    return null;
  }

  switch (metric) {
    case "revenue":
      return sumBy(rows, "revenue");
    case "orders":
      return sumBy(rows, "orders");
    case "unitsSold":
      return sumBy(rows, "unitsSold");
    case "customers":
      return sumBy(rows, "customers");
    case "sessions":
      return sumBy(rows, "sessions");
    case "adSpend":
      return sumBy(rows, "adSpend");
    case "averageOrderValue":
      return divideOrNull(sumBy(rows, "revenue"), sumBy(rows, "orders"));
    case "conversionRate":
      return divideOrNull(sumBy(rows, "orders") * 100, sumBy(rows, "sessions"));
    case "roas":
      return divideOrNull(
        sumBy(rows, "attributedRevenue"),
        sumBy(rows, "adSpend"),
      );
    case "refundRate":
      return divideOrNull(sumBy(rows, "refunds") * 100, sumBy(rows, "orders"));
  }
}

function getDimensionLabel(
  row: AnalyticsDailyRow,
  groupBy: NonNullable<AnalyticsQuery["groupBy"]>,
): string {
  const value = row[groupBy];

  return value ?? "Unattributed";
}

function groupMetricValues(
  rows: readonly AnalyticsDailyRow[],
  groupBy: NonNullable<AnalyticsQuery["groupBy"]>,
  metric: MetricKey,
): GroupedValues {
  const groupedRows = new Map<string, AnalyticsDailyRow[]>();

  for (const row of rows) {
    const label = getDimensionLabel(row, groupBy);
    const existingRows = groupedRows.get(label);

    if (existingRows) {
      existingRows.push(row);
    } else {
      groupedRows.set(label, [row]);
    }
  }

  return new Map(
    [...groupedRows.entries()].map(([label, grouped]) => [
      label,
      calculateMetricValue(metric, grouped),
    ]),
  );
}

function buildGroupedPoints(
  groupBy: NonNullable<AnalyticsQuery["groupBy"]>,
  currentValues: GroupedValues,
  previousValues: GroupedValues | undefined,
): DataPoint[] {
  if (!previousValues) {
    return [...currentValues.entries()].map(([label, value]) => ({
      label,
      value,
    }));
  }

  if (groupBy === "date") {
    const currentEntries = [...currentValues.entries()].sort(
      ([left], [right]) => left.localeCompare(right),
    );
    const previousEntries = [...previousValues.entries()].sort(
      ([left], [right]) => left.localeCompare(right),
    );

    return currentEntries.map(([label, value], index) => {
      const previousValue = previousEntries[index]?.[1] ?? null;

      return {
        label,
        value,
        previousValue,
        absoluteChange: calculateAbsoluteChange(value, previousValue),
        percentChange: calculatePercentChange(value, previousValue),
      };
    });
  }

  const labels = new Set([...currentValues.keys(), ...previousValues.keys()]);

  return [...labels].map((label) => {
    const value = currentValues.get(label) ?? null;
    const previousValue = previousValues.get(label) ?? null;

    return {
      label,
      value,
      previousValue,
      absoluteChange: calculateAbsoluteChange(value, previousValue),
      percentChange: calculatePercentChange(value, previousValue),
    };
  });
}

function sortAndLimitPoints(
  points: DataPoint[],
  query: AnalyticsQuery,
): DataPoint[] {
  const sorted = (() => {
    if (query.sort?.by === "value") {
      return calculateRanking(points, query.sort.direction);
    }

    const direction = query.sort?.direction ?? "asc";

    return [...points].sort((left, right) => {
      const labelOrder = left.label.localeCompare(right.label);

      return direction === "asc" ? labelOrder : -labelOrder;
    });
  })();

  return query.limit ? sorted.slice(0, query.limit) : sorted;
}

function selectRowsForPeriod(
  rows: readonly AnalyticsDailyRow[],
  period: ResolvedPeriod,
  filters: readonly AnalyticsFilter[],
): AnalyticsDailyRow[] {
  return applyAnalyticsFilters(
    rows.filter((row) => isWithinPeriod(row, period)),
    filters,
  );
}

export function executeAnalyticsQuery(
  rows: readonly AnalyticsDailyRow[],
  queryInput: AnalyticsQuery,
  dataRange: QueryEngineDataRange,
): AnalyticsDataset {
  const query = normalizeAnalyticsQuery(analyticsQuerySchema.parse(queryInput));
  const currentPeriod = resolvePeriod(
    query.period,
    dataRange.maxDate,
    dataRange,
  );
  const comparisonPeriod = resolveComparisonPeriod(
    currentPeriod,
    query.compareWith,
  );
  const currentRows = selectRowsForPeriod(rows, currentPeriod, query.filters);
  const comparisonRows = comparisonPeriod
    ? selectRowsForPeriod(rows, comparisonPeriod, query.filters)
    : undefined;
  const currentTotal = calculateMetricValue(query.metric, currentRows);
  const previousTotal = comparisonRows
    ? calculateMetricValue(query.metric, comparisonRows)
    : undefined;
  const warnings: string[] = [];

  if (currentRows.length === 0) {
    warnings.push("선택한 기간과 필터에 일치하는 데이터가 없습니다.");
  }

  if (comparisonPeriod && comparisonRows?.length === 0) {
    warnings.push("비교 기간에 사용할 수 있는 데이터가 없습니다.");
  }

  if (!query.groupBy) {
    const point: DataPoint = comparisonPeriod
      ? {
          label: metricCatalog[query.metric].label,
          value: currentTotal,
          previousValue: previousTotal ?? null,
          absoluteChange: calculateAbsoluteChange(
            currentTotal,
            previousTotal ?? null,
          ),
          percentChange: calculatePercentChange(
            currentTotal,
            previousTotal ?? null,
          ),
        }
      : { label: metricCatalog[query.metric].label, value: currentTotal };

    return {
      queryId: query.id,
      metric: query.metric,
      currentTotal,
      ...(comparisonPeriod ? { previousTotal: previousTotal ?? null } : {}),
      points: [point],
      dataRange: currentPeriod,
      ...(comparisonPeriod ? { comparisonRange: comparisonPeriod } : {}),
      empty: currentRows.length === 0,
      warnings,
    };
  }

  const currentValues = groupMetricValues(
    currentRows,
    query.groupBy,
    query.metric,
  );
  const previousValues = comparisonRows
    ? groupMetricValues(comparisonRows, query.groupBy, query.metric)
    : undefined;

  return {
    queryId: query.id,
    metric: query.metric,
    groupBy: query.groupBy,
    currentTotal,
    ...(comparisonPeriod ? { previousTotal: previousTotal ?? null } : {}),
    points: sortAndLimitPoints(
      buildGroupedPoints(query.groupBy, currentValues, previousValues),
      query,
    ),
    dataRange: currentPeriod,
    ...(comparisonPeriod ? { comparisonRange: comparisonPeriod } : {}),
    empty: currentRows.length === 0,
    warnings,
  };
}
