import { describe, expect, it } from "vitest";

import type { DashboardWidget } from "@/lib/ai/schemas/dashboard-spec";

import {
  applyWidgetTypeOverride,
  commitDashboardEditorSnapshot,
  createDashboardEditorDocument,
  reconcileDashboardEditorDocument,
  redoDashboardEditorDocument,
  undoDashboardEditorDocument,
} from "./dashboard-editor-model";

const widgets = [
  {
    id: "revenue",
    type: "metric",
    title: "매출",
    queryIds: ["metric-query"],
    findingIds: [],
    size: "small",
    config: { queryId: "metric-query", metric: "revenue" },
  },
  {
    id: "segments",
    type: "categoryBar",
    title: "주요 세그먼트",
    queryIds: ["segment-query"],
    findingIds: [],
    size: "medium",
    config: { queryId: "segment-query", orientation: "horizontal" },
  },
] satisfies DashboardWidget[];

describe("dashboard editor model", () => {
  it("creates deterministic responsive layouts for every widget", () => {
    const document = createDashboardEditorDocument(widgets);

    expect(document.present.layouts.lg.map((item) => item.i)).toEqual([
      "revenue",
      "segments",
    ]);
    expect(document.present.layouts.md).toHaveLength(2);
    expect(document.present.layouts.sm.every((item) => item.w === 1)).toBe(
      true,
    );
  });

  it("keeps bounded undo and redo snapshots", () => {
    const document = createDashboardEditorDocument(widgets);
    const changed = commitDashboardEditorSnapshot(document, {
      ...document.present,
      hiddenWidgetIds: ["revenue"],
    });
    const undone = undoDashboardEditorDocument(changed);
    const redone = redoDashboardEditorDocument(undone);

    expect(changed.past).toHaveLength(1);
    expect(undone.present.hiddenWidgetIds).toEqual([]);
    expect(redone.present.hiddenWidgetIds).toEqual(["revenue"]);
  });

  it("preserves matching edits and safely reconciles changed AI widgets", () => {
    const document = createDashboardEditorDocument(widgets);
    const edited = commitDashboardEditorSnapshot(document, {
      ...document.present,
      layouts: {
        ...document.present.layouts,
        lg: document.present.layouts.lg.map((item) =>
          item.i === "segments" ? { ...item, x: 6, y: 12 } : item,
        ),
      },
      hiddenWidgetIds: ["revenue"],
      typeOverrides: { segments: "donut" },
    });
    const nextWidgets = [
      widgets[1],
      {
        id: "insight",
        type: "insight",
        title: "핵심 근거",
        queryIds: ["segment-query"],
        findingIds: ["finding-1"],
        size: "medium",
        config: { findingId: "finding-1", tone: "neutral" },
      },
    ] satisfies DashboardWidget[];
    const reconciled = reconcileDashboardEditorDocument(edited, nextWidgets);

    expect(reconciled.present.hiddenWidgetIds).toEqual([]);
    expect(reconciled.present.typeOverrides).toEqual({ segments: "donut" });
    expect(
      reconciled.present.layouts.lg.find((item) => item.i === "segments"),
    ).toMatchObject({ x: 6, y: 12 });
    expect(
      reconciled.present.layouts.lg.find((item) => item.i === "insight")?.y,
    ).toBeGreaterThan(12);
  });

  it("only changes a widget inside its compatible display family", () => {
    const segmentWidget = widgets[1];
    const metricWidget = widgets[0];

    expect(applyWidgetTypeOverride(segmentWidget, "donut").type).toBe("donut");
    expect(applyWidgetTypeOverride(metricWidget, "dataTable")).toEqual(
      metricWidget,
    );
  });

  it("prevents a donut layout from shrinking below the compact chart height", () => {
    const donutWidget = applyWidgetTypeOverride(widgets[1], "donut");
    const document = createDashboardEditorDocument([widgets[0], donutWidget]);
    const legacyDocument = {
      ...document,
      present: {
        ...document.present,
        layouts: {
          ...document.present.layouts,
          lg: document.present.layouts.lg.map((item) =>
            item.i === "segments" ? { ...item, h: 6, minH: 6 } : item,
          ),
        },
      },
    };
    const reconciled = reconcileDashboardEditorDocument(legacyDocument, [
      widgets[0],
      donutWidget,
    ]);

    expect(
      reconciled.present.layouts.lg.find((item) => item.i === "segments"),
    ).toMatchObject({ h: 8, minH: 8 });
  });
});
