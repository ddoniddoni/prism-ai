import { describe, expect, it } from "vitest";

import {
  getDashboardContextFilterLabel,
  removeDashboardContextFilter,
} from "./dashboard-context-controls-data";

describe("Dashboard context controls", () => {
  it("creates readable labels from verified filter values", () => {
    expect(
      getDashboardContextFilterLabel({
        dimension: "category",
        operator: "eq",
        values: ["Electronics"],
      }),
    ).toBe("카테고리 · 전자제품");
    expect(
      getDashboardContextFilterLabel({
        dimension: "region",
        operator: "notIn",
        values: ["Seoul"],
      }),
    ).toBe("지역 · 서울 제외");
  });

  it("removes only the selected filter", () => {
    const categoryFilter = {
      dimension: "category" as const,
      operator: "eq" as const,
      values: ["Electronics"],
    };
    const filters = [
      categoryFilter,
      {
        dimension: "device" as const,
        operator: "eq" as const,
        values: ["mobile"],
      },
    ];

    expect(removeDashboardContextFilter(filters, categoryFilter)).toEqual([
      {
        dimension: "device",
        operator: "eq",
        values: ["mobile"],
      },
    ]);
  });
});
