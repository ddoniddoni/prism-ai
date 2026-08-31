import type { AnalyzeResponse } from "@/lib/analysis/schemas";

export type AnalysisDataSource = "local" | "supabase";

export type AnalysisCompletionEvent = {
  dataSource: AnalysisDataSource;
  requestHash: string;
  response: AnalyzeResponse;
};

export type AnalysisFailureEvent = {
  dataSource: AnalysisDataSource;
  errorCode: string;
  requestHash: string;
};

export interface AnalysisOperations {
  recordCompletion(event: AnalysisCompletionEvent): Promise<void>;
  recordFailure(event: AnalysisFailureEvent): Promise<void>;
}

export class ConsoleAnalysisOperations implements AnalysisOperations {
  async recordCompletion(event: AnalysisCompletionEvent): Promise<void> {
    console.info("analysis.operation", {
      eventType: "completed",
      requestHash: event.requestHash,
      dataSource: event.dataSource,
      provider: event.response.meta.provider,
      cacheHit: event.response.meta.cacheHit,
      fallbackUsed: event.response.meta.fallbackUsed,
      partial: event.response.meta.partial,
      durationMs: event.response.meta.durationMs,
    });
  }

  async recordFailure(event: AnalysisFailureEvent): Promise<void> {
    console.warn("analysis.operation", {
      eventType: event.errorCode === "RATE_LIMITED" ? "rate_limited" : "failed",
      requestHash: event.requestHash,
      dataSource: event.dataSource,
      errorCode: event.errorCode,
    });
  }
}
