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

const PrismRankedBarChart = dynamic(
  () =>
    import("../prism-ranked-bar-chart").then(
      (module) => module.PrismRankedBarChart,
    ),
  {
    loading: () => (
      <div
        aria-label="랭킹 차트를 불러오는 중"
        className="prism-skeleton h-44 rounded-xl"
      />
    ),
    ssr: false,
  },
);

export function CategoryBarWidget({
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
  if (widget.type !== "categoryBar") {
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
      descriptionClassName="sr-only"
      presentation={presentation}
      widget={widget}
    >
      <PrismRankedBarChart
        dimension={dataset?.groupBy}
        metric={dataset?.metric ?? "revenue"}
        points={dataset?.points ?? []}
        presentation={presentation}
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
