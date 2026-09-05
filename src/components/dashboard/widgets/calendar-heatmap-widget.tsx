"use client";

import dynamic from "next/dynamic";
import { DashboardDrilldown } from "../dashboard-drilldown";
import {
  getDashboardWidgetDisplayCopy,
  WidgetFrame,
} from "../dashboard-widget-frame";
import type { DashboardWidgetProps } from "./types";
import {
  createDrilldownSelection,
  getActiveDrilldown,
} from "./drilldown-selection";

const PrismCalendarHeatmap = dynamic(
  () =>
    import("../prism-calendar-heatmap").then(
      (module) => module.PrismCalendarHeatmap,
    ),
  {
    loading: () => (
      <div
        aria-label="캘린더 히트맵을 불러오는 중"
        className="prism-skeleton h-40 rounded-xl"
      />
    ),
    ssr: false,
  },
);

export function CalendarHeatmapWidget({
  activeDrilldown,
  widget,
  datasetsById,
  cardClassName,
  controls,
  drilldownAnalysisDisabled,
  findingsById,
  onDrilldownChange,
  onDrilldownAnalysis,
  presentation,
}: DashboardWidgetProps) {
  if (widget.type !== "calendarHeatmap") {
    return null;
  }

  const dataset = datasetsById.get(widget.config.queryId);
  const selectedDrilldown = getActiveDrilldown(
    activeDrilldown,
    widget.id,
    widget.config.queryId,
  );

  return (
    <WidgetFrame
      className={cardClassName}
      controls={controls}
      dataset={dataset}
      density={presentation === "feature" ? "feature" : "compact"}
      presentation={presentation}
      widget={widget}
    >
      <PrismCalendarHeatmap
        metric={dataset?.metric ?? "revenue"}
        points={dataset?.points ?? []}
        presentation={presentation}
        selectedDate={selectedDrilldown?.label}
        title={getDashboardWidgetDisplayCopy(widget, dataset).title}
        onSelectPoint={(label) =>
          onDrilldownChange?.(
            createDrilldownSelection(widget.id, widget.config.queryId, label),
          )
        }
      />
      {dataset && selectedDrilldown ? (
        <DashboardDrilldown
          dataset={dataset}
          disabled={drilldownAnalysisDisabled}
          findings={[...findingsById.values()]}
          onAnalyzeSelection={onDrilldownAnalysis}
          onDismiss={() => onDrilldownChange?.(null)}
          selection={selectedDrilldown}
        />
      ) : null}
    </WidgetFrame>
  );
}
