import { describe, expect, it } from "vitest";

import {
  isGeminiConfigured,
  isSupabaseConfigured,
  parseEnvironment,
} from "../lib/env";

describe("parseEnvironment", () => {
  it("uses the local mock defaults without API keys", () => {
    const environment = parseEnvironment({});

    expect(environment.AI_PROVIDER).toBe("mock");
    expect(environment.DATA_SOURCE).toBe("local");
  });

  it("marks incomplete Gemini settings as unavailable so the factory can fall back", () => {
    expect(
      isGeminiConfigured(parseEnvironment({ AI_PROVIDER: "gemini" })),
    ).toBe(false);
  });

  it("recognizes complete server-only Gemini settings", () => {
    expect(
      isGeminiConfigured(
        parseEnvironment({
          AI_PROVIDER: "gemini",
          GEMINI_API_KEY: "test-key",
          GEMINI_MODEL: "gemini-test-model",
        }),
      ),
    ).toBe(true);
  });

  it("keeps the live provider switch and persisted history opt-in on the server", () => {
    const environment = parseEnvironment({
      AI_LIVE_ENABLED: "false",
      PERSIST_ANALYSIS_HISTORY: "true",
    });

    expect(environment.AI_LIVE_ENABLED).toBe(false);
    expect(environment.PERSIST_ANALYSIS_HISTORY).toBe(true);
  });

  it("requires a server secret before selecting Supabase", () => {
    expect(
      isSupabaseConfigured(
        parseEnvironment({
          NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
        }),
      ),
    ).toBe(false);
    expect(
      isSupabaseConfigured(
        parseEnvironment({
          NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
          SUPABASE_SECRET_KEY: "server-only-secret",
        }),
      ),
    ).toBe(true);
  });
});
