import {
  getDashboardWidgetDisplayCopy,
  WidgetFrame,
} from "../dashboard-widget-frame";
import type { DashboardWidgetProps } from "./types";
import {
  formatChangeWithDirection,
  formatDimensionValue,
  formatMetricValue,
} from "../formatters";

export function TableWidget({
  widget,
  datasetsById,
  cardClassName,
  controls,
  presentation,
}: DashboardWidgetProps) {
  if (widget.type !== "rankingTable" && widget.type !== "dataTable") {
    return null;
  }

  const dataset = datasetsById.get(widget.config.queryId);
  const hasComparison = Boolean(dataset?.comparisonRange);
  const displayCopy = getDashboardWidgetDisplayCopy(widget, dataset);

  return (
    <WidgetFrame
      className={cardClassName}
      controls={controls}
      dataset={dataset}
      presentation={presentation}
      widget={widget}
    >
      <div className="min-w-0">
        <table className="w-full table-fixed text-left text-[11px] sm:text-[12px]">
          <caption className="sr-only">{displayCopy.title} 데이터 표</caption>
          <colgroup>
            {widget.type === "rankingTable" ? <col className="w-9" /> : null}
            <col />
            <col className="w-[34%]" />
            {hasComparison ? <col className="w-[24%]" /> : null}
          </colgroup>
          <thead className="border-b border-[#dde2e8] text-[9px] tracking-[0.1em] text-[#777587] uppercase">
            <tr>
              {widget.type === "rankingTable" ? (
                <th className="pb-2.5 font-medium">순위</th>
              ) : null}
              <th className="pb-2.5 font-medium">항목</th>
              <th className="pb-2.5 text-right font-medium">현재</th>
              {hasComparison ? (
                <th className="pb-2.5 text-right font-medium">변화</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {(dataset?.points ?? []).map((point, index) => (
              <tr className="border-b border-[#eef0f2]" key={point.label}>
                {widget.type === "rankingTable" ? (
                  <td className="py-2.5 font-mono text-[#777587]">
                    {index + 1}
                  </td>
                ) : null}
                <td className="min-w-0 py-2.5 font-medium text-[#191c1e]">
                  <span
                    className="block truncate"
                    title={formatDimensionValue(dataset?.groupBy, point.label)}
                  >
                    {formatDimensionValue(dataset?.groupBy, point.label)}
                  </span>
                </td>
                <td className="py-2.5 text-right text-[#424753]">
                  {formatMetricValue(dataset?.metric ?? "revenue", point.value)}
                </td>
                {hasComparison ? (
                  <td className="py-2.5 text-right text-[#595e6b]">
                    {formatChangeWithDirection(point.percentChange)}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetFrame>
  );
}
