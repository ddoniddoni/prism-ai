import { describe, expect, it } from "vitest";

import type { DashboardWidget } from "@/lib/ai/schemas/dashboard-spec";

import {
  applyWidgetTypeOverride,
  createBalancedDashboardEditorLayouts,
  commitDashboardEditorSnapshot,
  createDashboardEditorDocument,
  reconcileDashboardEditorDocument,
  redoDashboardEditorDocument,
  undoDashboardEditorDocument,
} from "./dashboard-editor-model";
import { getDashboardWidgetSpan } from "./dashboard-layout";

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

  it("uses query-result-aware spans to avoid empty dashboard rows", () => {
    const dashboardWidgets = [
      widgets[0],
      {
        id: "trend",
        type: "timeSeries",
        title: "기간별 흐름",
        queryIds: ["trend-query"],
        findingIds: [],
        size: "large",
        config: { queryId: "trend-query", xKey: "label" },
      },
      widgets[1],
      {
        id: "ranking",
        type: "rankingTable",
        title: "카테고리 순위",
        queryIds: ["ranking-query"],
        findingIds: [],
        size: "medium",
        config: { queryId: "ranking-query" },
      },
      {
        id: "insight",
        type: "insight",
        title: "계산된 핵심 근거",
        queryIds: ["trend-query"],
        findingIds: ["finding-1"],
        size: "medium",
        config: { findingId: "finding-1", tone: "neutral" },
      },
    ] satisfies DashboardWidget[];

    expect(
      dashboardWidgets.map((widget) =>
        getDashboardWidgetSpan(widget, dashboardWidgets, "lg"),
      ),
    ).toEqual([4, 8, 4, 8, 12]);
    expect(
      dashboardWidgets.map((widget) =>
        getDashboardWidgetSpan(widget, dashboardWidgets, "md"),
      ),
    ).toEqual([6, 6, 3, 3, 6]);
    expect(
      dashboardWidgets.map((widget) =>
        getDashboardWidgetSpan(widget, dashboardWidgets, "sm"),
      ),
    ).toEqual([1, 1, 1, 1, 1]);
  });

  it("rebalances an untouched layout while retaining an automatically measured height", () => {
    const dashboardWidgets = [
      widgets[0],
      {
        id: "trend",
        type: "timeSeries",
        title: "기간별 흐름",
        queryIds: ["trend-query"],
        findingIds: [],
        size: "large",
        config: { queryId: "trend-query", xKey: "label" },
      },
    ] satisfies DashboardWidget[];
    const document = createDashboardEditorDocument(dashboardWidgets);
    const layouts = createBalancedDashboardEditorLayouts(dashboardWidgets, {
      ...document.present.layouts,
      lg: document.present.layouts.lg.map((item) =>
        item.i === "trend" ? { ...item, h: 12 } : item,
      ),
    });

    expect(layouts.lg).toMatchObject([
      { i: "revenue", w: 4, x: 0, y: 0 },
      { i: "trend", w: 8, x: 4, y: 0, h: 12 },
    ]);
  });

  it("stacks supporting analysis into the short KPI lane", () => {
    const dashboardWidgets = [
      widgets[0],
      {
        id: "trend",
        type: "timeSeries",
        title: "기간별 흐름",
        queryIds: ["trend-query"],
        findingIds: [],
        size: "large",
        config: { queryId: "trend-query", xKey: "label" },
      },
      widgets[1],
      {
        id: "ranking",
        type: "rankingTable",
        title: "카테고리 순위",
        queryIds: ["ranking-query"],
        findingIds: [],
        size: "medium",
        config: { queryId: "ranking-query" },
      },
      {
        id: "insight",
        type: "insight",
        title: "계산된 핵심 근거",
        queryIds: ["trend-query"],
        findingIds: ["finding-1"],
        size: "medium",
        config: { findingId: "finding-1", tone: "neutral" },
      },
    ] satisfies DashboardWidget[];
    const layouts = createBalancedDashboardEditorLayouts(
      dashboardWidgets,
      createDashboardEditorDocument(dashboardWidgets).present.layouts,
    );

    expect(layouts.lg).toMatchObject([
      { i: "revenue", x: 0, y: 0, w: 4 },
      { i: "trend", x: 4, y: 0, w: 8 },
      { i: "segments", x: 0, y: 4, w: 4 },
      { i: "ranking", x: 4, y: 8, w: 8 },
      { i: "insight", x: 0, y: 15, w: 12 },
    ]);
  });

  it("places a compact calendar below the KPI and wide comparison below the trend", () => {
    const dashboardWidgets = [
      widgets[0],
      {
        id: "trend",
        type: "timeSeries",
        title: "기간별 흐름",
        queryIds: ["trend-query"],
        findingIds: [],
        size: "large",
        config: { queryId: "trend-query", xKey: "label" },
      },
      widgets[1],
      {
        id: "calendar-heatmap",
        type: "calendarHeatmap",
        title: "일자별 집중도",
        queryIds: ["trend-query"],
        findingIds: [],
        size: "medium",
        config: { queryId: "trend-query", xKey: "label" },
      },
    ] satisfies DashboardWidget[];
    const layouts = createBalancedDashboardEditorLayouts(
      dashboardWidgets,
      createDashboardEditorDocument(dashboardWidgets).present.layouts,
    );

    expect(
      dashboardWidgets.map((widget) =>
        getDashboardWidgetSpan(widget, dashboardWidgets, "lg"),
      ),
    ).toEqual([4, 8, 8, 4]);
    expect(layouts.lg).toMatchObject([
      { i: "revenue", x: 0, y: 0, w: 4, h: 4 },
      { i: "trend", x: 4, y: 0, w: 8, h: 8 },
      { i: "segments", x: 4, y: 8, w: 8, h: 6 },
      { i: "calendar-heatmap", x: 0, y: 4, w: 4, h: 6, minW: 4, minH: 4 },
    ]);
  });

  it("migrates a legacy saved layout to automatic Mosaic placement", () => {
    const document = createDashboardEditorDocument(widgets);
    const legacyDocument = {
      ...document,
      present: {
        ...document.present,
        layoutMode: undefined,
      },
    };

    expect(
      reconcileDashboardEditorDocument(legacyDocument, widgets).present
        .layoutMode,
    ).toBe("auto");
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
    ).toMatchObject({ h: 7, minH: 7 });
  });
});
