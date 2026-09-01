"use client";

import {
  ArrowDown,
  ArrowUp,
  Check,
  Edit3,
  GripVertical,
  Redo2,
  RotateCcw,
  Trash2,
  Undo2,
} from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  DashboardSpec,
  DashboardWidget,
} from "@/lib/ai/schemas/dashboard-spec";
import {
  applyWidgetTypeOverride,
  createBalancedDashboardEditorLayouts,
  createDashboardEditorDocument,
  editorGridColumns,
  getCompatibleWidgetTypes,
  reconcileDashboardEditorDocument,
  reconcileDashboardEditorSnapshot,
  type DashboardEditorSnapshot,
  type EditorBreakpoint,
  type EditableWidgetType,
} from "@/stores/dashboard-editor-model";
import { useDashboardEditorStore } from "@/stores/dashboard-editor-store";

import {
  DashboardHeader,
  DashboardWidgetCard,
  DashboardWidgetGrid,
} from "./dashboard-renderer";

type DashboardEditorProps = {
  dashboard: DashboardSpec;
  datasets: readonly AnalyticsDataset[];
  findings: readonly Finding[];
};

const editorBreakpoints: Record<EditorBreakpoint, number> = {
  lg: 1024,
  md: 640,
  sm: 0,
};
const editorGridMargin = [20, 20] as const;
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

const widgetTypeLabels: Record<EditableWidgetType, string> = {
  categoryBar: "막대 차트",
  donut: "도넛 차트",
  rankingTable: "순위 표",
  dataTable: "데이터 표",
};

function isEditableWidgetType(value: string): value is EditableWidgetType {
  return Object.prototype.hasOwnProperty.call(widgetTypeLabels, value);
}

function getGridRowsForContentHeight(contentHeight: number): number {
  return Math.ceil(
    (contentHeight + editorGridMargin[1]) /
      (editorRowHeight + editorGridMargin[1]),
  );
}

function usesCustomLayout(snapshot: DashboardEditorSnapshot): boolean {
  return snapshot.layoutMode === "custom";
}

function WidgetCardHeightObserver({
  children,
  onContentHeightChange,
}: {
  children: ReactNode;
  onContentHeightChange: (contentHeight: number) => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const content = contentRef.current;

    if (!content) {
      return;
    }

    const observedContent = content;

    function synchronizeHeight() {
      onContentHeightChange(
        Math.ceil(observedContent.getBoundingClientRect().height),
      );
    }

    synchronizeHeight();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(synchronizeHeight);

    observer.observe(observedContent);

    return () => observer.disconnect();
  }, [onContentHeightChange]);

  return <div ref={contentRef}>{children}</div>;
}

function WidgetEditorControls({
  dashboardId,
  onAction,
  widget,
}: {
  dashboardId: string;
  onAction: (message: string) => void;
  widget: DashboardWidget;
}) {
  const compatibleTypes = getCompatibleWidgetTypes(widget);

  function move(direction: "backward" | "forward") {
    useDashboardEditorStore
      .getState()
      .moveWidget(dashboardId, widget.id, direction);
    onAction(
      `${widget.title}을 ${direction === "backward" ? "앞" : "뒤"} 순서로 이동했습니다.`,
    );
  }

  function changeType(value: string) {
    if (!isEditableWidgetType(value)) {
      return;
    }

    useDashboardEditorStore
      .getState()
      .setWidgetType(dashboardId, widget.id, value);
    onAction(
      `${widget.title} 표시 형식을 ${widgetTypeLabels[value]}로 바꿨습니다.`,
    );
  }

  return (
    <div
      aria-label={`${widget.title} 편집 도구`}
      aria-describedby={`${widget.id}-editor-instructions`}
      className="flex flex-wrap items-center justify-end gap-1"
      role="group"
    >
      {compatibleTypes.length > 0 ? (
        <label>
          <span className="sr-only">{widget.title} 표시 형식</span>
          <select
            aria-label={`${widget.title} 표시 형식`}
            className="h-8 rounded-md border border-[#c9ccd2] bg-white px-2 text-[11px] font-medium text-[#424753] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f46e5]"
            onChange={(event) => changeType(event.target.value)}
            value={widget.type}
          >
            {compatibleTypes.map((type) => (
              <option key={type} value={type}>
                {widgetTypeLabels[type]}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <button
        aria-label={`${widget.title}을 앞 순서로 이동`}
        className="dashboard-control-button"
        onClick={() => move("backward")}
        title="앞 순서로 이동"
        type="button"
      >
        <ArrowUp aria-hidden="true" className="size-3.5" />
      </button>
      <button
        aria-label={`${widget.title}을 뒤 순서로 이동`}
        className="dashboard-control-button"
        onClick={() => move("forward")}
        title="뒤 순서로 이동"
        type="button"
      >
        <ArrowDown aria-hidden="true" className="size-3.5" />
      </button>
      <button
        aria-label={`${widget.title} 삭제`}
        className="dashboard-control-button text-[#93000a]"
        onClick={() => {
          useDashboardEditorStore.getState().hideWidget(dashboardId, widget.id);
          onAction(
            `${widget.title}을 삭제했습니다. 실행 취소로 복원할 수 있습니다.`,
          );
        }}
        title="위젯 삭제"
        type="button"
      >
        <Trash2 aria-hidden="true" className="size-3.5" />
      </button>
      <span
        aria-hidden="true"
        className="dashboard-control-button dashboard-drag-handle cursor-grab active:cursor-grabbing"
        title="드래그하여 이동"
      >
        <GripVertical aria-hidden="true" className="size-3.5" />
      </span>
      <p className="sr-only" id={`${widget.id}-editor-instructions`}>
        위젯은 드래그하거나 앞뒤 이동 버튼으로 순서를 바꿀 수 있습니다.
      </p>
    </div>
  );
}

function EditorToolbar({
  dashboard,
  isEditing,
  onAction,
  onEditingChange,
}: {
  dashboard: DashboardSpec;
  isEditing: boolean;
  onAction: (message: string) => void;
  onEditingChange: (isEditing: boolean) => void;
}) {
  const document = useDashboardEditorStore(
    (state) => state.documents[dashboard.id],
  );

  return (
    <div className="mt-5 flex flex-col gap-3 rounded-xl border border-[#dde2e8] bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[10px] font-semibold tracking-[0.1em] text-[#4f46e5] uppercase">
          Layout editor
        </p>
        <p className="mt-1 text-[12px] text-[#595e6b]">
          {isEditing
            ? "위젯을 이동하거나 크기와 표시 형식을 바꿀 수 있습니다."
            : "이 브라우저에 저장된 나만의 대시보드입니다."}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {isEditing ? (
          <>
            <button
              aria-label="대시보드 편집 실행 취소"
              className="dashboard-toolbar-button"
              disabled={!document || document.past.length === 0}
              onClick={() => {
                useDashboardEditorStore.getState().undo(dashboard.id);
                onAction("마지막 대시보드 편집을 실행 취소했습니다.");
              }}
              type="button"
            >
              <Undo2 aria-hidden="true" className="size-3.5" />
              실행 취소
            </button>
            <button
              aria-label="대시보드 편집 다시 실행"
              className="dashboard-toolbar-button"
              disabled={!document || document.future.length === 0}
              onClick={() => {
                useDashboardEditorStore.getState().redo(dashboard.id);
                onAction("마지막 대시보드 편집을 다시 실행했습니다.");
              }}
              type="button"
            >
              <Redo2 aria-hidden="true" className="size-3.5" />
              다시 실행
            </button>
            <button
              className="dashboard-toolbar-button"
              onClick={() => {
                useDashboardEditorStore
                  .getState()
                  .resetDashboard(dashboard.id, dashboard.widgets);
                onAction("대시보드 레이아웃을 기본값으로 초기화했습니다.");
              }}
              type="button"
            >
              <RotateCcw aria-hidden="true" className="size-3.5" />
              초기화
            </button>
          </>
        ) : null}
        <button
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#4f46e5] px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#3f37c9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f46e5]"
          onClick={() => {
            onEditingChange(!isEditing);
            onAction(
              isEditing
                ? "대시보드 편집을 마쳤습니다."
                : "대시보드 편집을 시작했습니다.",
            );
          }}
          type="button"
        >
          {isEditing ? (
            <Check aria-hidden="true" className="size-4" />
          ) : (
            <Edit3 aria-hidden="true" className="size-4" />
          )}
          {isEditing ? "편집 완료" : "대시보드 편집"}
        </button>
      </div>
    </div>
  );
}

export function DashboardEditor({
  dashboard,
  datasets,
  findings,
}: DashboardEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editorStatus, setEditorStatus] = useState("");
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
  const layouts = useMemo<ResponsiveLayouts<EditorBreakpoint>>(() => {
    const reconciledSnapshot = reconcileDashboardEditorSnapshot(
      document.present,
      resolvedWidgets,
    );
    const visibleWidgetIds = new Set(widgets.map((widget) => widget.id));
    const balancedLayouts = usesCustomLayout(document.present)
      ? reconciledSnapshot.layouts
      : createBalancedDashboardEditorLayouts(
          resolvedWidgets,
          reconciledSnapshot.layouts,
        );

    return {
      lg: balancedLayouts.lg.filter((item) => visibleWidgetIds.has(item.i)),
      md: balancedLayouts.md.filter((item) => visibleWidgetIds.has(item.i)),
      sm: balancedLayouts.sm.filter((item) => visibleWidgetIds.has(item.i)),
    };
  }, [document, resolvedWidgets, widgets]);
  const layoutKey = useMemo(
    () =>
      (["lg", "md", "sm"] as const)
        .map((breakpoint) =>
          (layouts[breakpoint] ?? [])
            .map((item) => `${item.i}:${item.x},${item.y},${item.w},${item.h}`)
            .join("|"),
        )
        .join("/"),
    [layouts],
  );
  const datasetsById = useMemo(
    () => new Map(datasets.map((dataset) => [dataset.queryId, dataset])),
    [datasets],
  );
  const findingsById = useMemo(
    () => new Map(findings.map((finding) => [finding.id, finding])),
    [findings],
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

      if (!layoutItem || requiredRows <= layoutItem.h) {
        return;
      }

      useDashboardEditorStore
        .getState()
        .ensureWidgetHeight(dashboard.id, breakpoint, widgetId, requiredRows);
    },
    [dashboard.id, layouts],
  );

  return (
    <section aria-labelledby="analysis-dashboard-title" className="mt-7">
      <DashboardHeader dashboard={dashboard} />
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
            datasets={datasets}
            findings={findings}
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
            key={layoutKey}
            layouts={layouts}
            margin={editorGridMargin}
            onBreakpointChange={(breakpoint) => {
              currentBreakpoint.current = breakpoint;
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
                  findingsById={findingsById}
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
