import { describe, expect, it } from "vitest";

import { RequestDeduplicator } from "./request-deduplicator";

describe("RequestDeduplicator", () => {
  it("shares only concurrent work and releases the key after it settles", async () => {
    const deduplicator = new RequestDeduplicator<string>();
    let calls = 0;
    let resolveFirst: ((value: string) => void) | undefined;
    const firstResult = new Promise<string>((resolve) => {
      resolveFirst = resolve;
    });
    const createResult = () => {
      calls += 1;
      return firstResult;
    };

    const first = deduplicator.run("same-analysis", createResult);
    const second = deduplicator.run("same-analysis", createResult);

    expect(second).toBe(first);
    expect(calls).toBe(1);

    resolveFirst?.("complete");

    await expect(first).resolves.toBe("complete");
    await expect(
      deduplicator.run("same-analysis", async () => "next"),
    ).resolves.toBe("next");
  });
});
