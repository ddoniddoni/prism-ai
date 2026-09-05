"use client";

import dynamic from "next/dynamic";
import { DashboardDrilldown } from "../dashboard-drilldown";
import {
  getDashboardWidgetDisplayCopy,
  WidgetFrame,
} from "../dashboard-widget-frame";
import type { DashboardWidgetProps } from "./types";
import { createDrilldownSelection } from "./drilldown-selection";
import { formatDimensionValue } from "../formatters";

const PrismStackedBarChart = dynamic(
  () =>
    import("../prism-stacked-bar-chart").then(
      (module) => module.PrismStackedBarChart,
    ),
  {
    loading: () => (
      <div
        aria-label="누적 막대 차트를 불러오는 중"
        className="prism-skeleton h-48 rounded-xl sm:h-52"
      />
    ),
    ssr: false,
  },
);

export function StackedBarWidget({
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
  if (widget.type !== "stackedBar") {
    return null;
  }

  const series = widget.config.series.flatMap((item) => {
    const dataset = datasetsById.get(item.queryId);

    return dataset
      ? [
          {
            id: item.queryId,
            label: formatDimensionValue("device", item.label),
            points: dataset.points,
          },
        ]
      : [];
  });
  const primaryDataset = datasetsById.get(
    widget.config.series[0]?.queryId ?? "",
  );
  const metric =
    datasetsById.get(widget.config.series[0]?.queryId ?? "")?.metric ??
    "revenue";
  const selectedDataset = activeDrilldown
    ? datasetsById.get(activeDrilldown.queryId)
    : undefined;
  const selectedDrilldown =
    activeDrilldown?.widgetId === widget.id && selectedDataset
      ? activeDrilldown
      : undefined;

  return (
    <WidgetFrame
      className={cardClassName}
      controls={controls}
      dataset={primaryDataset}
      descriptionClassName="sr-only"
      presentation={presentation}
      widget={widget}
    >
      <PrismStackedBarChart
        metric={metric}
        presentation={presentation}
        series={series}
        title={getDashboardWidgetDisplayCopy(widget, primaryDataset).title}
        onSelectPoint={(queryId, label) =>
          onDrilldownChange?.(
            createDrilldownSelection(widget.id, queryId, label),
          )
        }
      />
      {selectedDataset && selectedDrilldown ? (
        <DashboardDrilldown
          dataset={selectedDataset}
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
