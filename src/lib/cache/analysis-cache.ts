import {
  analyzeResponseSchema,
  type AnalyzeRequest,
  type AnalyzeResponse,
} from "@/lib/analysis/schemas";

type CacheClock = () => number;

type AnalysisCacheEntry = {
  expiresAt: number;
  response: AnalyzeResponse;
};

export type AnalysisCacheScope = {
  aiLiveEnabled: boolean;
  aiProvider: "gemini" | "mock";
  dataSource: "local" | "supabase";
};

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(",")}]`;
  }

  const record = value as Record<string, unknown>;

  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
    .join(",")}}`;
}

function cloneResponse(response: AnalyzeResponse): AnalyzeResponse {
  return analyzeResponseSchema.parse(structuredClone(response));
}

export function createAnalysisCacheKey(
  request: AnalyzeRequest,
  scope: AnalysisCacheScope,
): string {
  return stableSerialize({
    scope,
    question: request.question,
    ...(request.currentContext
      ? { currentContext: request.currentContext }
      : {}),
    ...(request.drilldownFilter
      ? { drilldownFilter: request.drilldownFilter }
      : {}),
  });
}

export function rebindAnalysisResponse(
  response: AnalyzeResponse,
  request: AnalyzeRequest,
  options: { cacheHit: boolean; durationMs: number },
): AnalyzeResponse {
  return analyzeResponseSchema.parse({
    ...cloneResponse(response),
    analysisId: `analysis-${request.requestId}`,
    sessionId: request.sessionId ?? `session-${request.requestId}`,
    dashboard: {
      ...response.dashboard,
      id: request.dashboardId ?? `dashboard-${request.requestId}`,
    },
    meta: {
      ...response.meta,
      cacheHit: options.cacheHit,
      durationMs: options.durationMs,
    },
  });
}

export class InMemoryAnalysisCache {
  private readonly entries = new Map<string, AnalysisCacheEntry>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries: number,
    private readonly now: CacheClock = Date.now,
  ) {}

  get(key: string): AnalyzeResponse | null {
    const entry = this.entries.get(key);

    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= this.now()) {
      this.entries.delete(key);
      return null;
    }

    this.entries.delete(key);
    this.entries.set(key, entry);

    return cloneResponse(entry.response);
  }

  set(key: string, response: AnalyzeResponse): void {
    this.entries.delete(key);
    this.entries.set(key, {
      response: cloneResponse(response),
      expiresAt: this.now() + this.ttlMs,
    });

    while (this.entries.size > this.maxEntries) {
      const oldestEntry = this.entries.keys().next();

      if (oldestEntry.done) {
        return;
      }

      this.entries.delete(oldestEntry.value);
    }
  }
}
