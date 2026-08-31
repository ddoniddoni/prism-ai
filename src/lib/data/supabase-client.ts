import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env, isSupabaseConfigured, type AppEnvironment } from "@/lib/env";

import type { SupabaseDatabase } from "./supabase-database";

export class SupabaseConfigurationError extends Error {
  constructor() {
    super(
      "Supabase data source requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.",
    );
    this.name = "SupabaseConfigurationError";
  }
}

export function createSupabaseServerClient(
  environment: AppEnvironment = env,
): SupabaseClient<SupabaseDatabase> {
  if (!isSupabaseConfigured(environment)) {
    throw new SupabaseConfigurationError();
  }

  return createClient<SupabaseDatabase>(
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
}
