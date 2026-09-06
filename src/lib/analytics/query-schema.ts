import { z } from "zod";

import {
  dimensionKeys,
  filterableDimensionKeys,
  type DimensionKey,
  type FilterableDimensionKey,
} from "./dimension-catalog";
import { metricKeys, type MetricKey } from "./metric-catalog";

export const periodPresets = [
  "last7Days",
  "last30Days",
  "thisMonth",
  "lastMonth",
  "last90Days",
  "thisQuarter",
  "lastQuarter",
  "thisYear",
  "lastYear",
  "custom",
] as const;

export type PeriodPreset = (typeof periodPresets)[number];

export const compareModes = [
  "none",
  "previousPeriod",
  "previousMonth",
  "previousYear",
] as const;

export type CompareMode = (typeof compareModes)[number];

export const filterOperators = ["eq", "in", "notIn"] as const;

export type FilterOperator = (typeof filterOperators)[number];

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식의 날짜가 필요합니다.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, "존재하는 날짜를 입력해 주세요.");

const filterValueSchema = z.string().trim().min(1).max(120);

export const analyticsFilterSchema = z
  .object({
    dimension: z.enum(filterableDimensionKeys),
    operator: z.enum(filterOperators),
    values: z.array(filterValueSchema).min(1).max(20),
  })
  .strict();

export const analyticsPeriodSchema = z
  .object({
    preset: z.enum(periodPresets),
    startDate: isoDateSchema.optional(),
    endDate: isoDateSchema.optional(),
  })
  .strict()
  .superRefine((period, context) => {
    if (period.preset === "custom") {
      if (
        period.startDate &&
        period.endDate &&
        period.startDate > period.endDate
      ) {
        context.addIssue({
          code: "custom",
          path: ["endDate"],
          message: "종료일은 시작일보다 빠를 수 없습니다.",
        });
      }
      if (!period.startDate) {
        context.addIssue({
          code: "custom",
          path: ["startDate"],
          message: "Custom 기간에는 시작일이 필요합니다.",
        });
      }

      if (!period.endDate) {
        context.addIssue({
          code: "custom",
          path: ["endDate"],
          message: "Custom 기간에는 종료일이 필요합니다.",
        });
      }
    }
  });

export const analyticsSortSchema = z
  .object({
    direction: z.enum(["asc", "desc"]),
    by: z.enum(["value", "label"]),
  })
  .strict();

export const analyticsQuerySchema = z
  .object({
    id: z.string().trim().min(1).max(80),
    metric: z.enum(metricKeys),
    groupBy: z.enum(dimensionKeys).optional(),
    period: analyticsPeriodSchema,
    compareWith: z.enum(compareModes),
    filters: z.array(analyticsFilterSchema).max(20),
    sort: analyticsSortSchema.optional(),
    limit: z.number().int().min(1).max(50).optional(),
  })
  .strict();

export const analyticsQueriesSchema = z
  .array(analyticsQuerySchema)
  .min(1)
  .max(8)
  .superRefine((queries, context) => {
    const ids = new Set<string>();

    for (const [index, query] of queries.entries()) {
      if (ids.has(query.id)) {
        context.addIssue({
          code: "custom",
          path: [index, "id"],
          message: "Query ID는 분석 안에서 고유해야 합니다.",
        });
      }

      ids.add(query.id);
    }
  });

export type AnalyticsFilter = z.infer<typeof analyticsFilterSchema>;
export type AnalyticsPeriod = z.infer<typeof analyticsPeriodSchema>;
export type AnalyticsSort = z.infer<typeof analyticsSortSchema>;
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;

const metricKeySet = new Set<string>(metricKeys);
const dimensionKeySet = new Set<string>(dimensionKeys);
const filterableDimensionKeySet = new Set<string>(filterableDimensionKeys);

export function normalizeAnalyticsFilters(
  filters: readonly AnalyticsFilter[],
): AnalyticsFilter[] {
  const normalizedByKey = new Map<string, AnalyticsFilter>();

  for (const filter of filters) {
    const values = [
      ...new Set(filter.values.map((value) => value.trim())),
    ].sort((left, right) => left.localeCompare(right));
    const normalized: AnalyticsFilter = {
      dimension: filter.dimension,
      operator: filter.operator,
      values,
    };
    const key = `${normalized.dimension}:${normalized.operator}:${values.join("\u0001")}`;

    normalizedByKey.set(key, normalized);
  }

  return [...normalizedByKey.values()].sort((left, right) => {
    const leftKey = `${left.dimension}:${left.operator}:${left.values.join("\u0001")}`;
    const rightKey = `${right.dimension}:${right.operator}:${right.values.join("\u0001")}`;

    return leftKey.localeCompare(rightKey);
  });
}

export function normalizeAnalyticsQuery(input: AnalyticsQuery): AnalyticsQuery {
  return {
    ...input,
    id: input.id.trim(),
    filters: normalizeAnalyticsFilters(input.filters),
  };
}

export function getAnalyticsQuerySignature(query: AnalyticsQuery): string {
  const normalized = normalizeAnalyticsQuery(query);

  return JSON.stringify({
    metric: normalized.metric,
    groupBy: normalized.groupBy,
    period: normalized.period,
    compareWith: normalized.compareWith,
    filters: normalized.filters,
    sort: normalized.sort,
    limit: normalized.limit,
  });
}

export function deduplicateAnalyticsQueries(
  queries: readonly AnalyticsQuery[],
): AnalyticsQuery[] {
  const signatures = new Set<string>();
  const uniqueQueries: AnalyticsQuery[] = [];

  for (const query of queries) {
    const normalized = normalizeAnalyticsQuery(query);
    const signature = getAnalyticsQuerySignature(normalized);

    if (!signatures.has(signature)) {
      uniqueQueries.push(normalized);
      signatures.add(signature);
    }
  }

  return uniqueQueries;
}

export function isMetricKey(value: string): value is MetricKey {
  return metricKeySet.has(value);
}

export function isDimensionKey(value: string): value is DimensionKey {
  return dimensionKeySet.has(value);
}

export function isFilterableDimensionKey(
  value: string,
): value is FilterableDimensionKey {
  return filterableDimensionKeySet.has(value);
}
