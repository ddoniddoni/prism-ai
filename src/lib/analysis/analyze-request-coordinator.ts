import "server-only";

import { createHash } from "node:crypto";

import {
  createAnalysisCacheKey,
  InMemoryAnalysisCache,
  rebindAnalysisResponse,
} from "@/lib/cache/analysis-cache";
import { env, isSupabaseConfigured, type AppEnvironment } from "@/lib/env";
import { createAnalysisOperations } from "@/lib/operations/create-analysis-operations";
import type {
  AnalysisDataSource,
  AnalysisOperations,
} from "@/lib/operations/analysis-operations";
import { DailyRateLimiter } from "@/lib/rate-limit/daily-rate-limiter";
import { RequestDeduplicator } from "@/lib/request-dedup/request-deduplicator";

import { AnalyzeQuestionService } from "./analyze-question-service";
import {
  analyzeRequestSchema,
  type AnalyzeRequest,
  type AnalyzeResponse,
} from "./schemas";

type CoordinatedAnalysis = {
  cacheHit: boolean;
  response: AnalyzeResponse;
};

type CoordinatorClock = () => number;

export type AnalyzeRequestCoordinatorDependencies = {
  cache?: InMemoryAnalysisCache;
  deduplicator?: RequestDeduplicator<CoordinatedAnalysis>;
  environment?: AppEnvironment;
  executeAnalysis?: (request: AnalyzeRequest) => Promise<AnalyzeResponse>;
  now?: CoordinatorClock;
  operations?: AnalysisOperations;
  rateLimiter?: DailyRateLimiter;
};

export class RateLimitExceededError extends Error {
  constructor(readonly retryAfterSeconds: number) {
    super("The daily demo analysis limit has been reached.");
    this.name = "RateLimitExceededError";
  }
}

function resolveDataSource(environment: AppEnvironment): AnalysisDataSource {
  return environment.DATA_SOURCE === "supabase" &&
    isSupabaseConfigured(environment)
    ? "supabase"
    : "local";
}

function hashCacheKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

function getErrorCode(error: unknown): string {
  if (error instanceof RateLimitExceededError) {
    return "RATE_LIMITED";
  }

  return "ANALYSIS_FAILED";
}

export class AnalyzeRequestCoordinator {
  private readonly environment: AppEnvironment;
  private readonly dataSource: AnalysisDataSource;
  private readonly cache: InMemoryAnalysisCache;
  private readonly deduplicator: RequestDeduplicator<CoordinatedAnalysis>;
  private readonly executeAnalysis: (
    request: AnalyzeRequest,
  ) => Promise<AnalyzeResponse>;
  private readonly now: CoordinatorClock;
  private readonly operations: AnalysisOperations;
  private readonly rateLimiter: DailyRateLimiter;

  constructor(dependencies: AnalyzeRequestCoordinatorDependencies = {}) {
    this.environment = dependencies.environment ?? env;
    this.dataSource = resolveDataSource(this.environment);
    this.cache =
      dependencies.cache ??
      new InMemoryAnalysisCache(
        this.environment.ANALYSIS_CACHE_TTL_MS,
        this.environment.ANALYSIS_CACHE_MAX_ENTRIES,
      );
    this.deduplicator =
      dependencies.deduplicator ??
      new RequestDeduplicator<CoordinatedAnalysis>();
    this.executeAnalysis =
      dependencies.executeAnalysis ??
      ((request) => new AnalyzeQuestionService().execute(request));
    this.now = dependencies.now ?? Date.now;
    this.operations =
      dependencies.operations ?? createAnalysisOperations(this.environment);
    this.rateLimiter =
      dependencies.rateLimiter ??
      new DailyRateLimiter(this.environment.DEMO_DAILY_LIMIT);
  }

  async execute(
    input: AnalyzeRequest,
    clientIdentity: string,
  ): Promise<AnalyzeResponse> {
    const request = analyzeRequestSchema.parse(input);
    const startedAt = this.now();
    const cacheKey = createAnalysisCacheKey(request, {
      aiLiveEnabled: this.environment.AI_LIVE_ENABLED,
      aiProvider: this.environment.AI_PROVIDER,
      dataSource: this.dataSource,
    });
    const requestHash = hashCacheKey(cacheKey);

    try {
      const computed = await this.deduplicator.run(cacheKey, async () => {
        const cachedResponse = this.cache.get(cacheKey);

        if (cachedResponse) {
          return { response: cachedResponse, cacheHit: true };
        }

        const rateLimit = this.rateLimiter.consume(clientIdentity);

        if (!rateLimit.allowed) {
          throw new RateLimitExceededError(rateLimit.retryAfterSeconds);
        }

        const response = await this.executeAnalysis(request);
        this.cache.set(cacheKey, response);

        return { response, cacheHit: false };
      });
      const response = rebindAnalysisResponse(computed.response, request, {
        cacheHit: computed.cacheHit,
        durationMs: this.now() - startedAt,
      });

      void Promise.allSettled([
        this.operations.recordCompletion({
          dataSource: this.dataSource,
          requestHash,
          response,
        }),
      ]);

      return response;
    } catch (error) {
      void Promise.allSettled([
        this.operations.recordFailure({
          dataSource: this.dataSource,
          errorCode: getErrorCode(error),
          requestHash,
        }),
      ]);

      throw error;
    }
  }
}
