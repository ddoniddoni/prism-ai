import "server-only";

import { env, isSupabaseConfigured, type AppEnvironment } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/data/supabase-client";

import {
  ConsoleAnalysisOperations,
  type AnalysisOperations,
} from "./analysis-operations";
import { SupabaseAnalysisOperations } from "./supabase-analysis-operations";

export function createAnalysisOperations(
  environment: AppEnvironment = env,
): AnalysisOperations {
  if (isSupabaseConfigured(environment)) {
    return new SupabaseAnalysisOperations(
      createSupabaseServerClient(environment),
      environment.PERSIST_ANALYSIS_HISTORY,
    );
  }

  return new ConsoleAnalysisOperations();
}
