import { describe, expect, it } from "vitest";

import { parseEnvironment } from "@/lib/env";

import { createAIProvider } from "./create-provider";

describe("createAIProvider", () => {
  it("keeps the demo in Mock Mode when Gemini is selected without server settings", () => {
    const provider = createAIProvider(
      parseEnvironment({ AI_PROVIDER: "gemini" }),
    );

    expect(provider.metadata).toEqual({
      provider: "mock",
      model: null,
      mockMode: true,
      fallbackUsed: true,
    });
  });

  it("selects Gemini only when both server settings are present", () => {
    const provider = createAIProvider(
      parseEnvironment({
        AI_PROVIDER: "gemini",
        GEMINI_API_KEY: "test-key",
        GEMINI_MODEL: "gemini-test-model",
      }),
    );

    expect(provider.metadata).toEqual({
      provider: "gemini",
      model: "gemini-test-model",
      mockMode: false,
      fallbackUsed: false,
    });
  });
});
