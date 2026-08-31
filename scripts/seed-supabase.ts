import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

import localAnalyticsDailyRows from "../src/data/analytics-daily.json";
import {
  LOCAL_DATASET_END_DATE,
  LOCAL_DATASET_START_DATE,
  LOCAL_DATASET_VERSION,
} from "../src/lib/data/generate-local-data";
import { analyticsDailyRowsSchema } from "../src/lib/data/repository";
import type { AnalyticsDailyRow } from "../src/lib/data/repository";
import { isSupabaseConfigured, parseEnvironment } from "../src/lib/env";
import type {
  SupabaseAnalyticsDailyInsert,
  SupabaseDatabase,
} from "../src/lib/data/supabase-database";

const batchSize = 500;

function toSupabaseRow(row: AnalyticsDailyRow): SupabaseAnalyticsDailyInsert {
  return {
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
  };
}

async function seedSupabase(): Promise<void> {
  loadEnvConfig(process.cwd());

  const environment = parseEnvironment();

  if (!isSupabaseConfigured(environment)) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required.",
    );
  }

  const rows = analyticsDailyRowsSchema.parse(localAnalyticsDailyRows);
  const supabaseRows = rows.map(toSupabaseRow);
  const client = createClient<SupabaseDatabase>(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.SUPABASE_SECRET_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );
  const { error: deleteError } = await client
    .from("analytics_daily")
    .delete()
    .gte("id", 0);

  if (deleteError) {
    throw new Error("Unable to clear the Supabase analytics dataset.");
  }

  for (let start = 0; start < supabaseRows.length; start += batchSize) {
    const { error } = await client
      .from("analytics_daily")
      .insert(supabaseRows.slice(start, start + batchSize));

    if (error) {
      throw new Error("Unable to insert the Supabase analytics dataset.");
    }
  }

  const { error: metadataError } = await client
    .from("analytics_dataset_metadata")
    .upsert(
      {
        dataset_key: "analytics_daily",
        version: LOCAL_DATASET_VERSION,
        min_date: LOCAL_DATASET_START_DATE,
        max_date: LOCAL_DATASET_END_DATE,
        row_count: rows.length,
      },
      { onConflict: "dataset_key" },
    );

  if (metadataError) {
    throw new Error("Unable to save Supabase dataset metadata.");
  }

  process.stdout.write(`Seeded ${rows.length} analytics rows in Supabase.\n`);
}

seedSupabase().catch((error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : "Unable to seed the Supabase analytics dataset.";

  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
