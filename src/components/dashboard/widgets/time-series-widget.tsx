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
import { formatMetricValue } from "../formatters";

const PrismTrendChart = dynamic(
  () => import("../prism-trend-chart").then((module) => module.PrismTrendChart),
  {
    loading: () => (
      <div
        aria-label="추이 차트를 불러오는 중"
        className="prism-skeleton h-52 rounded-xl sm:h-60"
      />
    ),
    ssr: false,
  },
);

export function TimeSeriesWidget({
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
  if (widget.type !== "timeSeries") {
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
      presentation={presentation}
      widget={widget}
    >
      <PrismTrendChart
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
      <details className="mt-2 text-[11px] text-[#595e6b]">
        <summary className="cursor-pointer font-medium text-[#4f46e5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f46e5]">
          차트 데이터 표 보기
        </summary>
        <div className="mt-2 max-h-44 overflow-auto">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">
              {getDashboardWidgetDisplayCopy(widget, dataset).title} 원본 데이터
            </caption>
            <thead className="text-[#777587]">
              <tr>
                <th className="pb-2 font-medium">날짜</th>
                <th className="pb-2 text-right font-medium">값</th>
              </tr>
            </thead>
            <tbody>
              {(dataset?.points ?? []).map((point) => (
                <tr className="border-t border-[#eef0f2]" key={point.label}>
                  <td className="py-2">{point.label}</td>
                  <td className="py-2 text-right font-mono">
                    {formatMetricValue(
                      dataset?.metric ?? "revenue",
                      point.value,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </WidgetFrame>
  );
}
