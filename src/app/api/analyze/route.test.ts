import { describe, expect, it } from "vitest";

import { analyzeResponseSchema } from "@/lib/analysis/schemas";

import { POST } from "./route";

describe("POST /api/analyze", () => {
  it("validates the request and returns a verified mock analysis", async () => {
    const response = await POST(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: "지난달 매출이 왜 감소했어?",
          requestId: "route-test-request",
        }),
      }),
    );
    const body: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(analyzeResponseSchema.safeParse(body).success).toBe(true);
  });

  it("rejects an invalid request before it reaches the service", async () => {
    const response = await POST(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "x", requestId: "short" }),
      }),
    );

    expect(response.status).toBe(400);
  });
});
