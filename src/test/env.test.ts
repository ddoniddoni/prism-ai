import { describe, expect, it } from "vitest";

import { parseEnvironment } from "../lib/env";

describe("parseEnvironment", () => {
  it("uses the local mock defaults without API keys", () => {
    const environment = parseEnvironment({});

    expect(environment.AI_PROVIDER).toBe("mock");
    expect(environment.DATA_SOURCE).toBe("local");
  });

  it("requires both Gemini settings when the live provider is selected", () => {
    expect(() => parseEnvironment({ AI_PROVIDER: "gemini" })).toThrow(
      "AI_PROVIDER=gemini requires GEMINI_API_KEY and GEMINI_MODEL",
    );
  });
});
