import "server-only";

import { env, isSupabaseConfigured, type AppEnvironment } from "@/lib/env";

import { LocalAnalyticsRepository } from "./local-repository";
import type { AnalyticsRepository } from "./repository";
import { createSupabaseServerClient } from "./supabase-client";
import { SupabaseAnalyticsRepository } from "./supabase-repository";

export function createAnalyticsRepository(
  environment: AppEnvironment = env,
): AnalyticsRepository {
  if (
    environment.DATA_SOURCE === "supabase" &&
    isSupabaseConfigured(environment)
  ) {
    return new SupabaseAnalyticsRepository({
      client: createSupabaseServerClient(environment),
    });
  }

  return new LocalAnalyticsRepository();
}
