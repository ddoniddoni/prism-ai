import localAnalyticsDailyRows from "@/data/analytics-daily.json";
import { executeAnalyticsQuery } from "@/lib/analytics/query-engine";
import type { AnalyticsQuery } from "@/lib/analytics/query-schema";
import {
  analyticsDailyRowsSchema,
  type AnalyticsDataRange,
  type AnalyticsRepository,
} from "@/lib/data/repository";
import { LOCAL_DATASET_VERSION } from "@/lib/data/generate-local-data";

const rows = Object.freeze(
  analyticsDailyRowsSchema
    .parse(localAnalyticsDailyRows)
    .map((row) => Object.freeze({ ...row })),
);

function resolveDataRange(): AnalyticsDataRange {
  let minDate = rows[0]?.date;
  let maxDate = rows[0]?.date;

  if (!minDate || !maxDate) {
    throw new Error(
      "The local analytics dataset must include at least one row.",
    );
  }

  for (const row of rows) {
    if (row.date < minDate) {
      minDate = row.date;
    }

    if (row.date > maxDate) {
      maxDate = row.date;
    }
  }

  return { minDate, maxDate };
}

const dataRange = resolveDataRange();

export class LocalAnalyticsRepository implements AnalyticsRepository {
  async getRows() {
    return rows;
  }

  async execute(query: AnalyticsQuery) {
    return executeAnalyticsQuery(rows, query, dataRange);
  }

  async getDataRange() {
    return dataRange;
  }

  async getDatasetVersion() {
    return LOCAL_DATASET_VERSION;
  }
}
