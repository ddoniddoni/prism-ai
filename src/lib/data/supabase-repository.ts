import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { executeAnalyticsQuery } from "@/lib/analytics/query-engine";
import type { AnalyticsQuery } from "@/lib/analytics/query-schema";

import { createSupabaseServerClient } from "./supabase-client";
import type { SupabaseDatabase } from "./supabase-database";
import {
  analyticsDailyRowsSchema,
  type AnalyticsDataRange,
  type AnalyticsDailyRow,
  type AnalyticsRepository,
} from "./repository";

export class SupabaseAnalyticsRepositoryError extends Error {
  constructor(readonly code: "INVALID_DATA" | "QUERY_FAILED") {
    super("Supabase analytics data is unavailable.");
    this.name = "SupabaseAnalyticsRepositoryError";
  }
}

function resolveDataRange(
  rows: readonly AnalyticsDailyRow[],
): AnalyticsDataRange {
  const firstRow = rows[0];

  if (!firstRow) {
    throw new SupabaseAnalyticsRepositoryError("INVALID_DATA");
  }

  let minDate = firstRow.date;
  let maxDate = firstRow.date;

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

function fallbackDatasetVersion(
  rows: readonly AnalyticsDailyRow[],
  dataRange: AnalyticsDataRange,
): string {
  return `supabase-${dataRange.minDate}-${dataRange.maxDate}-${rows.length}`;
}

function toAnalyticsDailyRow(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const row = value as Record<string, unknown>;

  return {
    date: row.date,
    device: row.device,
    category: row.category,
    product: row.product,
    trafficSource: row.traffic_source ?? row.trafficSource,
    region: row.region,
    customerSegment: row.customer_segment ?? row.customerSegment,
    campaign: row.campaign,
    revenue: row.revenue,
    orders: row.orders,
    unitsSold: row.units_sold ?? row.unitsSold,
    customers: row.customers,
    sessions: row.sessions,
    adSpend: row.ad_spend ?? row.adSpend,
    attributedRevenue: row.attributed_revenue ?? row.attributedRevenue,
    refunds: row.refunds,
  };
}

export type SupabaseAnalyticsRepositoryDependencies = {
  client?: SupabaseClient<SupabaseDatabase>;
  loadRows?: () => Promise<unknown>;
  loadDatasetVersion?: () => Promise<string | null>;
};

export class SupabaseAnalyticsRepository implements AnalyticsRepository {
  private readonly loadRows: () => Promise<unknown>;
  private readonly loadDatasetVersion: () => Promise<string | null>;
  private rowsPromise: Promise<readonly AnalyticsDailyRow[]> | undefined;
  private dataRangePromise: Promise<AnalyticsDataRange> | undefined;
  private datasetVersionPromise: Promise<string> | undefined;

  constructor(dependencies: SupabaseAnalyticsRepositoryDependencies = {}) {
    const getClient = () => dependencies.client ?? createSupabaseServerClient();

    this.loadRows =
      dependencies.loadRows ??
      (async () => {
        const client = getClient();
        const { data, error } = await client
          .from("analytics_daily")
          .select("*")
          .order("date", { ascending: true });

        if (error) {
          throw new SupabaseAnalyticsRepositoryError("QUERY_FAILED");
        }

        return data;
      });

    this.loadDatasetVersion =
      dependencies.loadDatasetVersion ??
      (async () => {
        const client = getClient();
        const { data, error } = await client
          .from("analytics_dataset_metadata")
          .select("version")
          .eq("dataset_key", "analytics_daily")
          .maybeSingle();

        if (error) {
          throw new SupabaseAnalyticsRepositoryError("QUERY_FAILED");
        }

        return data?.version ?? null;
      });
  }

  async getRows(): Promise<readonly AnalyticsDailyRow[]> {
    this.rowsPromise ??= this.loadAndValidateRows();
    return this.rowsPromise;
  }

  async execute(query: AnalyticsQuery) {
    const [rows, dataRange] = await Promise.all([
      this.getRows(),
      this.getDataRange(),
    ]);

    return executeAnalyticsQuery(rows, query, dataRange);
  }

  async getDataRange(): Promise<AnalyticsDataRange> {
    this.dataRangePromise ??= this.getRows().then(resolveDataRange);
    return this.dataRangePromise;
  }

  async getDatasetVersion(): Promise<string> {
    this.datasetVersionPromise ??= this.resolveDatasetVersion();
    return this.datasetVersionPromise;
  }

  private async loadAndValidateRows(): Promise<readonly AnalyticsDailyRow[]> {
    const rawRows = await this.loadRows();
    const parsed = analyticsDailyRowsSchema.safeParse(
      Array.isArray(rawRows) ? rawRows.map(toAnalyticsDailyRow) : rawRows,
    );

    if (!parsed.success) {
      throw new SupabaseAnalyticsRepositoryError("INVALID_DATA");
    }

    return Object.freeze(parsed.data.map((row) => Object.freeze({ ...row })));
  }

  private async resolveDatasetVersion(): Promise<string> {
    const configuredVersion = await this.loadDatasetVersion();

    if (configuredVersion) {
      return configuredVersion;
    }

    const rows = await this.getRows();
    const dataRange = await this.getDataRange();

    return fallbackDatasetVersion(rows, dataRange);
  }
}
