import { describe, expect, it } from "vitest";

import { DailyRateLimiter, getDemoClientIdentity } from "./daily-rate-limiter";

describe("DailyRateLimiter", () => {
  it("limits each client until the next UTC day", () => {
    const limiter = new DailyRateLimiter(
      2,
      () => new Date("2026-08-31T12:00:00.000Z"),
    );

    expect(limiter.consume("203.0.113.10")).toMatchObject({
      allowed: true,
      remaining: 1,
    });
    expect(limiter.consume("203.0.113.10")).toMatchObject({
      allowed: true,
      remaining: 0,
    });
    expect(limiter.consume("203.0.113.10")).toMatchObject({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 43_200,
    });
  });

  it("allows an explicit zero limit to disable the demo limiter", () => {
    const limiter = new DailyRateLimiter(0);

    expect(limiter.consume("anonymous")).toEqual({
      allowed: true,
      remaining: null,
      retryAfterSeconds: 0,
    });
  });

  it("uses the first proxy address and avoids retaining oversized headers", () => {
    const request = new Request("http://localhost/api/analyze", {
      headers: { "x-forwarded-for": `203.0.113.10, ${"x".repeat(200)}` },
    });

    expect(getDemoClientIdentity(request)).toBe("203.0.113.10");
  });
});
