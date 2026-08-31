import { describe, expect, it } from "vitest";

import { isGeminiConfigured, parseEnvironment } from "../lib/env";

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
});
