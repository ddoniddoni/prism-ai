import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { SupabaseDatabase, Json } from "@/lib/data/supabase-database";

import type {
  AnalysisCompletionEvent,
  AnalysisFailureEvent,
  AnalysisOperations,
} from "./analysis-operations";

function toJson(value: unknown): Json {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(
        "Operation metadata must not include non-finite numbers.",
      );
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value.map(toJson);
  }

  if (typeof value === "object") {
    const serialized: { [key: string]: Json | undefined } = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      serialized[key] = toJson(nestedValue);
    }

    return serialized;
  }

  throw new Error("Operation metadata must be JSON serializable.");
}

export class SupabaseAnalysisOperations implements AnalysisOperations {
  constructor(
    private readonly client: SupabaseClient<SupabaseDatabase>,
    private readonly persistHistory: boolean,
  ) {}

  async recordCompletion(event: AnalysisCompletionEvent): Promise<void> {
    const metadata = toJson(event.response.meta);
    const eventWrite = this.client.from("analysis_operation_events").insert({
      event_type: "completed",
      request_hash: event.requestHash,
      data_source: event.dataSource,
      provider: event.response.meta.provider,
      cache_hit: event.response.meta.cacheHit,
      fallback_used: event.response.meta.fallbackUsed,
      partial: event.response.meta.partial,
      duration_ms: event.response.meta.durationMs,
    });

    if (this.persistHistory) {
      const [eventResult, historyResult] = await Promise.all([
        eventWrite,
        this.client.from("analysis_history").insert({
          analysis_id: event.response.analysisId,
          session_id: event.response.sessionId,
          request_hash: event.requestHash,
          context: toJson(event.response.context),
          dashboard: toJson(event.response.dashboard),
          metadata,
        }),
      ]);

      if (eventResult.error || historyResult.error) {
        throw new Error("Supabase operational logging failed.");
      }

      return;
    }

    const { error } = await eventWrite;

    if (error) {
      throw new Error("Supabase operational logging failed.");
    }
  }

  async recordFailure(event: AnalysisFailureEvent): Promise<void> {
    const { error } = await this.client
      .from("analysis_operation_events")
      .insert({
        event_type:
          event.errorCode === "RATE_LIMITED" ? "rate_limited" : "failed",
        request_hash: event.requestHash,
        data_source: event.dataSource,
        error_code: event.errorCode,
      });

    if (error) {
      throw new Error("Supabase operational logging failed.");
    }
  }
}
