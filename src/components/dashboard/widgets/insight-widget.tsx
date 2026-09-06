import { WidgetFrame } from "../dashboard-widget-frame";
import type { DashboardWidgetProps } from "./types";
import { formatMetricValue, localizeAnalyticsText } from "../formatters";
import { metricCatalog } from "@/lib/analytics/metric-catalog";

export function InsightWidget({
  widget,
  findingsById,
  datasetsById,
  cardClassName,
  controls,
  presentation,
}: DashboardWidgetProps) {
  if (widget.type !== "insight") {
    return null;
  }

  const finding = findingsById.get(widget.config.findingId);
  const toneClass: Record<typeof widget.config.tone, string> = {
    neutral: "border-[#c3c0ff] bg-[#eef2ff]",
    positive: "border-[#a8dcc5] bg-[#effaf5]",
    warning: "border-[#ebcf9d] bg-[#fff9ec]",
    critical: "border-[#f0b8b4] bg-[#fff4f2]",
  };

  return (
    <WidgetFrame
      className={cardClassName}
      controls={controls}
      presentation={presentation}
      widget={widget}
    >
      <div className={`rounded-lg border p-4 ${toneClass[widget.config.tone]}`}>
        <p className="text-[13px] leading-6 text-[#191c1e]">
          {finding
            ? localizeAnalyticsText(finding.fallbackText)
            : "검증된 분석 근거를 찾지 못했습니다."}
        </p>
        {finding?.contributionPercent !== undefined &&
        finding.contributionPercent !== null &&
        Math.abs(finding.contributionPercent) > 100 ? (
          <p className="mt-2 text-xs leading-6 text-[#595e6b]">
            다른 항목의 반대 방향 변화가 일부를 상쇄해, 전체 순변화에 대한
            기여도가 100%를 넘을 수 있습니다.
          </p>
        ) : null}
        {finding ? (
          <details className="mt-3 text-xs leading-6 text-[#595e6b]">
            <summary className="min-h-8 cursor-pointer font-semibold text-[#4f46e5]">
              계산 근거 보기
            </summary>
            {finding.evidenceQueryIds.map((queryId) => {
              const dataset = datasetsById.get(queryId);
              if (!dataset) return null;
              return (
                <div
                  className="mt-2 border-t border-current/10 pt-2"
                  key={queryId}
                >
                  <p>{metricCatalog[dataset.metric].description}</p>
                  <p>
                    {dataset.dataRange.startDate} ~ {dataset.dataRange.endDate}
                  </p>
                  <p>
                    전체 집계:{" "}
                    {formatMetricValue(dataset.metric, dataset.currentTotal)}
                  </p>
                  {dataset.comparisonRange ? (
                    <p>
                      비교 집계:{" "}
                      {formatMetricValue(
                        dataset.metric,
                        dataset.previousTotal ?? null,
                      )}
                    </p>
                  ) : null}
                  {finding.segment ? (
                    <p>
                      분석 항목: {localizeAnalyticsText(finding.segment)} ·{" "}
                      {formatMetricValue(
                        dataset.metric,
                        finding.currentValue ?? null,
                      )}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </details>
        ) : null}
      </div>
    </WidgetFrame>
  );
}
