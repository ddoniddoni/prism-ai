import localAnalyticsDailyRows from "@/data/analytics-daily.json";
import { describe, expect, it } from "vitest";

import {
  LOCAL_DATASET_END_DATE,
  LOCAL_DATASET_START_DATE,
} from "./generate-local-data";
import {
  SupabaseAnalyticsRepository,
} from "./supabase-repository";

describe("SupabaseAnalyticsRepository", () => {
  it("normalizes database column names before using the shared analytics engine", async () => {
    const repository = new SupabaseAnalyticsRepository({
      loadRows: async () =>
        localAnalyticsDailyRows.map((row) => ({
          date: row.date,
          device: row.device,
          category: row.category,
          product: row.product,
          traffic_source: row.trafficSource,
          region: row.region,
          customer_segment: row.customerSegment,
          campaign: row.campaign,
          revenue: row.revenue,
          orders: row.orders,
          units_sold: row.unitsSold,
          customers: row.customers,
          sessions: row.sessions,
          ad_spend: row.adSpend,
          attributed_revenue: row.attributedRevenue,
          refunds: row.refunds,
        })),
      loadDatasetVersion: async () => "supabase-test-v1",
    });

    await expect(repository.getDataRange()).resolves.toEqual({
      minDate: LOCAL_DATASET_START_DATE,
      maxDate: LOCAL_DATASET_END_DATE,
    });
    await expect(repository.getDatasetVersion()).resolves.toBe(
      "supabase-test-v1",
    );
  });

  it("rejects malformed rows before analytics calculations", async () => {
    const repository = new SupabaseAnalyticsRepository({
      loadRows: async () => [{ date: "not-a-date" }],
      loadDatasetVersion: async () => null,
    });

    await expect(repository.getRows()).rejects.toEqual(
      expect.objectContaining({
        code: "INVALID_DATA",
      }),
    );
  });
});
