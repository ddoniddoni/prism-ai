import "server-only";

import { env, isGeminiConfigured, type AppEnvironment } from "@/lib/env";

import { FallbackAIProvider } from "./fallback-provider";
import { GeminiAIProvider } from "./gemini-provider";
import type { AIProvider } from "./provider";
import { MockAIProvider } from "./mock-provider";

export function createAIProvider(
  environment: AppEnvironment = env,
): AIProvider {
  if (environment.AI_PROVIDER === "gemini" && !environment.AI_LIVE_ENABLED) {
    return new MockAIProvider({ fallbackUsed: true });
  }

  if (environment.AI_PROVIDER === "gemini" && isGeminiConfigured(environment)) {
    try {
      return new FallbackAIProvider(
        new GeminiAIProvider({
          apiKey: environment.GEMINI_API_KEY,
          model: environment.GEMINI_MODEL,
          timeoutMs: environment.AI_REQUEST_TIMEOUT_MS,
          maxCallsPerAnalysis: environment.AI_MAX_CALLS_PER_ANALYSIS,
        }),
        new MockAIProvider(),
      );
    } catch {
      return new MockAIProvider({ fallbackUsed: true });
    }
  }

  if (environment.AI_PROVIDER === "gemini") {
    return new MockAIProvider({ fallbackUsed: true });
  }

  return new MockAIProvider();
}
