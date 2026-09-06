"use client";

import { useState } from "react";
import { ChevronDown, Download } from "lucide-react";
import type { AnalyzeResponse } from "@/lib/analysis/schemas";
import { metricCatalog } from "@/lib/analytics/metric-catalog";
import { dimensionCatalog } from "@/lib/analytics/dimension-catalog";
import { createAnalysisCsv } from "./analysis-export-data";

export function AnalysisResultTools({
  response,
}: {
  response: AnalyzeResponse;
}) {
  const [message, setMessage] = useState("");
  const warnings = [
    ...new Set(response.datasets.flatMap((dataset) => dataset.warnings)),
  ];
  const failedQueries = response.plan.queries.filter(
    (query) =>
      !response.datasets.some((dataset) => dataset.queryId === query.id),
  );

  function download() {
    let url: string | undefined;
    try {
      url = URL.createObjectURL(
        new Blob([createAnalysisCsv(response)], {
          type: "text/csv;charset=utf-8",
        }),
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `prism-${response.context.primaryMetric}-${response.datasets[0]?.dataRange.endDate ?? "analysis"}.csv`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setMessage(
        "분석 데이터 다운로드를 요청했습니다. 전체 집계와 분류별 집계는 별도 행입니다.",
      );
    } catch {
      setMessage("파일을 준비하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      if (url) {
        const objectUrl = url;
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
      }
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
      <details className="group min-w-0 flex-1 rounded-lg border border-[#dde2e8] bg-white px-3">
        <summary className="flex min-h-11 cursor-pointer items-center text-xs font-medium text-[#595e6b]">
          조회 근거 · {response.datasets.length}/{response.plan.queries.length}
          개 조회 완료
          {warnings.length > 0 ? ` · 안내 ${warnings.length}개` : ""}
          <ChevronDown
            aria-hidden="true"
            className="ml-2 size-3.5 shrink-0 group-open:rotate-180"
          />
        </summary>
        <div className="space-y-3 border-t border-[#dde2e8] py-3 text-xs leading-6 text-[#595e6b]">
          <p>
            표시된 숫자는 조회 데이터에서 계산했습니다. 증감과 연관성은 원인을
            확정하는 근거가 아닙니다.
          </p>
          <ul className="space-y-1">
            {response.datasets.map((dataset) => (
              <li key={dataset.queryId}>
                <span className="font-semibold">
                  {metricCatalog[dataset.metric].label}
                </span>{" "}
                ·{" "}
                {dataset.groupBy
                  ? dimensionCatalog[dataset.groupBy].label
                  : "전체 집계"}{" "}
                · {dataset.dataRange.startDate} ~ {dataset.dataRange.endDate}
                {dataset.empty ? " · 데이터 없음" : ""}
                {dataset.comparisonRange ? (
                  <span className="block text-[#777587]">
                    비교: {dataset.comparisonRange.startDate} ~{" "}
                    {dataset.comparisonRange.endDate}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
          {failedQueries.length > 0 ? (
            <p className="text-[#93000a]">
              조회 실패:{" "}
              {failedQueries
                .map(
                  (query) =>
                    `${metricCatalog[query.metric].label} (${query.groupBy ? dimensionCatalog[query.groupBy].label : "전체"})`,
                )
                .join(", ")}
            </p>
          ) : null}
          {warnings.map((warning) => (
            <p key={warning} className="text-[#8a5800]">
              {warning}
            </p>
          ))}
          <p>
            내보내기에는 현재 분석의 모든 조회 결과가 포함됩니다. 숨긴 위젯의
            데이터도 포함되며 빈 값은 0과 구분됩니다.
          </p>
        </div>
      </details>
      <button
        className="dashboard-toolbar-button bg-white"
        onClick={download}
        type="button"
      >
        <Download aria-hidden="true" className="size-4" />
        데이터 내려받기
      </button>
      <p className="w-full text-xs text-[#595e6b] empty:hidden" role="status">
        {message}
      </p>
    </div>
  );
}
