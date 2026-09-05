"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ResponsiveGridLayout,
  useContainerWidth,
  verticalCompactor,
  type Layout,
  type ResponsiveLayouts,
} from "react-grid-layout";

import type { Finding } from "@/lib/analytics/findings";
import type { AnalyticsDataset } from "@/lib/analytics/query-engine";
import type {
  AnalyticsFilter,
  CompareMode,
} from "@/lib/analytics/query-schema";
import type { DashboardSpec } from "@/lib/ai/schemas/dashboard-spec";
import {
  applyWidgetTypeOverride,
  createBalancedDashboardEditorLayouts,
  createDashboardEditorDocument,
  editorGridColumns,
  reconcileDashboardEditorDocument,
  reconcileDashboardEditorSnapshot,
  type DashboardEditorSnapshot,
  type EditorBreakpoint,
} from "@/stores/dashboard-editor-model";
import {
  createDashboardLayoutPlan,
  dashboardLayoutConstraints,
  type DashboardLayoutDataDensity,
} from "@/stores/dashboard-layout";
import { useDashboardEditorStore } from "@/stores/dashboard-editor-store";

import { DashboardHeader } from "./dashboard-header";
import { DashboardWidgetCard } from "./dashboard-widget-registry";
import { DashboardWidgetGrid } from "./dashboard-renderer";
import {
  EditorToolbar,
  WidgetEditorControls,
} from "./dashboard-editor-controls";
import { WidgetCardHeightObserver } from "./widget-card-height-observer";
import {
  getDashboardWidgetDrilldown,
  type DashboardDrilldownSelection,
} from "./dashboard-drilldown-data";

type DashboardEditorProps = {
  dashboard: DashboardSpec;
  comparisonControlsDisabled?: boolean;
  contextFilterControlsDisabled?: boolean;
  datasets: readonly AnalyticsDataset[];
  drilldownAnalysisDisabled?: boolean;
  findings: readonly Finding[];
  onContextFiltersChange?: (filters: readonly AnalyticsFilter[]) => void;
  onComparisonChange?: (compareWith: CompareMode) => void;
  onDrilldownAnalysis?: (filter: AnalyticsFilter) => void;
};

const editorBreakpoints: Record<EditorBreakpoint, number> = {
  lg: 1024,
  md: 640,
  sm: 0,
};
const editorGridMargin = [
  dashboardLayoutConstraints.lg.gutterPx,
  dashboardLayoutConstraints.lg.gutterPx,
] as const;
const editorRowHeight = 28;

const activeDragConfig = {
  enabled: true,
  bounded: true,
  handle: ".dashboard-drag-handle",
  cancel: "button, select, a, input, textarea",
  threshold: 3,
} as const;

const inactiveDragConfig = {
  ...activeDragConfig,
  enabled: false,
} as const;

const activeResizeConfig = {
  enabled: true,
  handles: ["se"],
} as const;

const inactiveResizeConfig = {
  ...activeResizeConfig,
  enabled: false,
} as const;

function getGridRowsForContentHeight(contentHeight: number): number {
  return Math.ceil(
    (contentHeight + editorGridMargin[1]) /
      (editorRowHeight + editorGridMargin[1]),
  );
}

function usesCustomLayout(snapshot: DashboardEditorSnapshot): boolean {
  return snapshot.layoutMode === "custom";
}

export function DashboardEditor({
  dashboard,
  comparisonControlsDisabled = false,
  contextFilterControlsDisabled = false,
  datasets,
  drilldownAnalysisDisabled = false,
  findings,
  onComparisonChange,
  onContextFiltersChange,
  onDrilldownAnalysis,
}: DashboardEditorProps) {
  const [activeDrilldown, setActiveDrilldown] =
    useState<DashboardDrilldownSelection | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editorStatus, setEditorStatus] = useState("");
  const [activeBreakpoint, setActiveBreakpoint] =
    useState<EditorBreakpoint>("lg");
  const currentBreakpoint = useRef<EditorBreakpoint>("lg");
  const { width, containerRef, mounted } = useContainerWidth({
    measureBeforeMount: true,
  });
  const hasHydrated = useDashboardEditorStore((state) => state.hasHydrated);
  const storedDocument = useDashboardEditorStore(
    (state) => state.documents[dashboard.id],
  );

  useEffect(() => {
    let isActive = true;

    async function hydrateAndInitialize() {
      if (!useDashboardEditorStore.persist.hasHydrated()) {
        await useDashboardEditorStore.persist.rehydrate();
      }

      if (!isActive) {
        return;
      }

      const store = useDashboardEditorStore.getState();
      store.setHydrated(true);
      store.initializeDashboard(dashboard.id, dashboard.widgets);
    }

    void hydrateAndInitialize();

    return () => {
      isActive = false;
    };
  }, [dashboard.id, dashboard.widgets]);

  const document = useMemo(
    () =>
      reconcileDashboardEditorDocument(
        storedDocument ?? createDashboardEditorDocument(dashboard.widgets),
        dashboard.widgets,
      ),
    [dashboard.widgets, storedDocument],
  );
  const resolvedWidgets = useMemo(
    () =>
      dashboard.widgets.map((widget) =>
        applyWidgetTypeOverride(
          widget,
          document.present.typeOverrides[widget.id],
        ),
      ),
    [dashboard.widgets, document.present.typeOverrides],
  );
  const widgets = useMemo(() => {
    const hiddenWidgetIds = new Set(document.present.hiddenWidgetIds);

    return resolvedWidgets.filter((widget) => !hiddenWidgetIds.has(widget.id));
  }, [document.present.hiddenWidgetIds, resolvedWidgets]);
  const layoutDataDensity = useMemo<DashboardLayoutDataDensity>(
    () =>
      Object.fromEntries(
        datasets.map((dataset) => [dataset.queryId, dataset.points.length]),
      ),
    [datasets],
  );
  const layouts = useMemo<ResponsiveLayouts<EditorBreakpoint>>(() => {
    const reconciledSnapshot = reconcileDashboardEditorSnapshot(
      document.present,
      resolvedWidgets,
    );
    const visibleWidgetIds = new Set(widgets.map((widget) => widget.id));
    const balancedLayouts = usesCustomLayout(document.present)
      ? reconciledSnapshot.layouts
      : createBalancedDashboardEditorLayouts(
          widgets,
          reconciledSnapshot.layouts,
          layoutDataDensity,
        );

    return {
      lg: balancedLayouts.lg.filter((item) => visibleWidgetIds.has(item.i)),
      md: balancedLayouts.md.filter((item) => visibleWidgetIds.has(item.i)),
      sm: balancedLayouts.sm.filter((item) => visibleWidgetIds.has(item.i)),
    };
  }, [document, layoutDataDensity, resolvedWidgets, widgets]);
  const datasetsById = useMemo(
    () => new Map(datasets.map((dataset) => [dataset.queryId, dataset])),
    [datasets],
  );
  const findingsById = useMemo(
    () => new Map(findings.map((finding) => [finding.id, finding])),
    [findings],
  );
  const activeLayoutPlan = useMemo(
    () =>
      createDashboardLayoutPlan(widgets, activeBreakpoint, layoutDataDensity),
    [activeBreakpoint, layoutDataDensity, widgets],
  );

  function commitLayout(layout: Layout) {
    useDashboardEditorStore
      .getState()
      .commitLayout(dashboard.id, currentBreakpoint.current, layout);
  }

  const ensureWidgetContentHeight = useCallback(
    (widgetId: string, contentHeight: number) => {
      const breakpoint = currentBreakpoint.current;
      const currentLayout = layouts[breakpoint];

      if (!currentLayout) {
        return;
      }

      const layoutItem = currentLayout.find((item) => item.i === widgetId);
      const requiredRows = getGridRowsForContentHeight(contentHeight);

      if (!layoutItem) {
        return;
      }

      useDashboardEditorStore
        .getState()
        .ensureWidgetHeight(dashboard.id, breakpoint, widgetId, requiredRows);
    },
    [dashboard.id, layouts],
  );
  const handleDrilldownChange = useCallback(
    (selection: DashboardDrilldownSelection | null) => {
      setActiveDrilldown(selection);
    },
    [],
  );

  return (
    <section aria-labelledby="analysis-dashboard-title" className="mt-7">
      <DashboardHeader
        dashboard={dashboard}
        comparisonControlsDisabled={comparisonControlsDisabled}
        filterControlsDisabled={contextFilterControlsDisabled}
        onComparisonChange={onComparisonChange}
        onFiltersChange={onContextFiltersChange}
      />
      <EditorToolbar
        dashboard={dashboard}
        isEditing={isEditing}
        onAction={setEditorStatus}
        onEditingChange={setIsEditing}
      />
      <p aria-live="polite" className="sr-only" role="status">
        {editorStatus}
      </p>

      <div className="dashboard-grid-container" ref={containerRef}>
        {!hasHydrated || !mounted ? (
          <DashboardWidgetGrid
            activeDrilldown={activeDrilldown}
            datasets={datasets}
            drilldownAnalysisDisabled={drilldownAnalysisDisabled}
            findings={findings}
            onDrilldownChange={handleDrilldownChange}
            onDrilldownAnalysis={onDrilldownAnalysis}
            widgets={widgets}
          />
        ) : widgets.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-[#c9ccd2] bg-white px-6 py-12 text-center">
            <p className="text-sm font-semibold text-[#191c1e]">
              표시할 위젯이 없습니다.
            </p>
            <p className="mt-2 text-[12px] text-[#595e6b]">
              실행 취소 또는 초기화로 위젯을 다시 불러올 수 있습니다.
            </p>
          </div>
        ) : (
          <ResponsiveGridLayout<EditorBreakpoint>
            breakpoints={editorBreakpoints}
            className={`mt-5 ${isEditing ? "is-editing" : ""}`}
            cols={editorGridColumns}
            compactor={verticalCompactor}
            containerPadding={[0, 0]}
            dragConfig={isEditing ? activeDragConfig : inactiveDragConfig}
            layouts={layouts}
            margin={editorGridMargin}
            onBreakpointChange={(breakpoint) => {
              currentBreakpoint.current = breakpoint;
              setActiveBreakpoint(breakpoint);
            }}
            onDragStop={commitLayout}
            onResizeStop={commitLayout}
            resizeConfig={isEditing ? activeResizeConfig : inactiveResizeConfig}
            rowHeight={editorRowHeight}
            width={width}
          >
            {widgets.map((widget) => {
              const card = (
                <DashboardWidgetCard
                  activeDrilldown={getDashboardWidgetDrilldown(
                    activeDrilldown,
                    widget.id,
                  )}
                  cardClassName="overflow-visible lg:col-span-12"
                  controls={
                    isEditing ? (
                      <WidgetEditorControls
                        dashboardId={dashboard.id}
                        onAction={setEditorStatus}
                        widget={widget}
                      />
                    ) : undefined
                  }
                  datasetsById={datasetsById}
                  drilldownAnalysisDisabled={drilldownAnalysisDisabled}
                  findingsById={findingsById}
                  onDrilldownChange={handleDrilldownChange}
                  onDrilldownAnalysis={onDrilldownAnalysis}
                  presentation={
                    activeLayoutPlan.get(widget.id)?.presentation ?? "standard"
                  }
                  widget={widget}
                />
              );

              return (
                <div key={widget.id}>
                  <WidgetCardHeightObserver
                    onContentHeightChange={(contentHeight) =>
                      ensureWidgetContentHeight(widget.id, contentHeight)
                    }
                  >
                    {card}
                  </WidgetCardHeightObserver>
                </div>
              );
            })}
          </ResponsiveGridLayout>
        )}
      </div>
    </section>
  );
}
