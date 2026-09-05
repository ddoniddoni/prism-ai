import { WidgetFrame } from "../dashboard-widget-frame";
import type { DashboardWidgetProps } from "./types";
import { formatChangeWithDirection, formatMetricValue } from "../formatters";

export function MetricWidget({
  widget,
  datasetsById,
  cardClassName,
  controls,
  presentation,
}: DashboardWidgetProps) {
  if (widget.type !== "metric") {
    return null;
  }

  const dataset = datasetsById.get(widget.config.queryId);
  const change = dataset?.points[0]?.percentChange ?? null;

  return (
    <WidgetFrame
      className={cardClassName}
      controls={controls}
      dataset={dataset}
      density="compact"
      descriptionClassName="sr-only"
      presentation={presentation}
      widget={widget}
    >
      <p className="text-[28px] leading-none font-semibold tracking-[-0.045em] text-[#191c1e] sm:text-3xl">
        {formatMetricValue(widget.config.metric, dataset?.currentTotal)}
      </p>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#eef0f2] pt-2.5">
        <span className="text-[11px] text-[#595e6b]">
          {dataset?.comparisonRange ? "비교 기간 대비" : "비교 없음"}
        </span>
        <span
          className={`text-[12px] font-semibold ${change !== null && change < 0 ? "text-[#ba1a1a]" : "text-[#17835c]"}`}
        >
          {formatChangeWithDirection(change)}
        </span>
      </div>
    </WidgetFrame>
  );
}
