import { describe, expect, it } from "vitest";
import type { DashboardWidget } from "@/lib/ai/schemas/dashboard-spec";
import {
  createDashboardLayoutPlan,
  dashboardLayoutConstraints,
  getDashboardUnusedCanvasRatio,
} from "./dashboard-layout";
import {
  createDashboardEditorDocument,
  commitDashboardEditorSnapshot,
  restoreDashboardWidget,
  undoDashboardEditorDocument,
} from "./dashboard-editor-model";

const widgets: DashboardWidget[] = [
  {
    id: "metric",
    type: "metric",
    title: "매출",
    queryIds: ["total"],
    findingIds: [],
    size: "small",
    config: { queryId: "total", metric: "revenue" },
  },
  {
    id: "bar",
    type: "categoryBar",
    title: "지역",
    queryIds: ["groups"],
    findingIds: [],
    size: "medium",
    config: { queryId: "groups", orientation: "horizontal" },
  },
  {
    id: "table",
    type: "rankingTable",
    title: "순위",
    queryIds: ["groups"],
    findingIds: [],
    size: "medium",
    config: { queryId: "groups" },
  },
  {
    id: "insight",
    type: "insight",
    title: "근거",
    queryIds: [],
    findingIds: [],
    size: "large",
    config: { findingId: "finding", tone: "neutral" },
  },
];

describe("adaptive dashboard layout", () => {
  it.each(["lg", "md", "sm"] as const)(
    "avoids overlap and excessive holes for every visible subset at %s",
    (breakpoint) => {
      for (let mask = 1; mask < 1 << widgets.length; mask += 1) {
        const visible = widgets.filter((_, index) => mask & (1 << index));
        const plan = createDashboardLayoutPlan(
          visible,
          breakpoint,
          { groups: 20 },
          { metric: 9, bar: 12 },
        );
        const items = [...plan.values()];
        expect(items).toHaveLength(visible.length);
        expect(
          getDashboardUnusedCanvasRatio(plan, breakpoint),
        ).toBeLessThanOrEqual(
          dashboardLayoutConstraints[breakpoint].maxUnusedCanvasRatio,
        );
        for (const [index, item] of items.entries()) {
          expect(item.x + item.w).toBeLessThanOrEqual(
            dashboardLayoutConstraints[breakpoint].columns,
          );
          for (const other of items.slice(index + 1)) {
            const overlaps =
              item.x < other.x + other.w &&
              item.x + item.w > other.x &&
              item.y < other.y + other.h &&
              item.y + item.h > other.y;
            expect(overlaps).toBe(false);
          }
        }
        expect(plan.get("metric")?.h ?? 9).toBeGreaterThanOrEqual(9);
      }
    },
  );

  it("restores one hidden widget without discarding chart overrides and supports undo", () => {
    const document = createDashboardEditorDocument(widgets);
    document.present.hiddenWidgetIds = ["bar", "table"];
    document.present.typeOverrides = { bar: "donut" };
    document.present.layoutMode = "custom";
    const restored = commitDashboardEditorSnapshot(
      document,
      restoreDashboardWidget(document.present, "bar"),
    );
    expect(restored.present.hiddenWidgetIds).toEqual(["table"]);
    expect(restored.present.typeOverrides).toEqual({ bar: "donut" });
    expect(undoDashboardEditorDocument(restored).present).toEqual(
      document.present,
    );
  });
});
