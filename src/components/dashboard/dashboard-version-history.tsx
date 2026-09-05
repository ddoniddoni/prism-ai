"use client";

import { Check, ChevronRight, History, RotateCcw } from "lucide-react";
import { useMemo } from "react";

import { metricCatalog } from "@/lib/analytics/metric-catalog";
import type { AnalysisHistoryEntry } from "@/lib/history/local-analysis-history";

import { getDashboardContextFilterLabel } from "./dashboard-context-controls-data";
import { getComparisonLabel } from "./formatters";
import {
  getAnalysisVersionPeriodLabel,
  getDashboardSessionVersions,
} from "./dashboard-version-history-data";

type DashboardVersionHistoryProps = {
  activeAnalysisId: string;
  entries: readonly AnalysisHistoryEntry[];
  onSelectVersion: (entry: AnalysisHistoryEntry) => void;
  sessionId: string;
};

function formatVersionTime(createdAt: string): string {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "시간 정보 없음";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function DashboardVersionHistory({
  activeAnalysisId,
  entries,
  onSelectVersion,
  sessionId,
}: DashboardVersionHistoryProps) {
  const versions = useMemo(
    () => getDashboardSessionVersions(entries, sessionId),
    [entries, sessionId],
  );

  if (versions.length < 2) {
    return null;
  }

  return (
    <section
      aria-label="분석 버전 기록"
      className="mt-4 overflow-hidden rounded-xl border border-[#dfe2ed] bg-white shadow-[0_8px_28px_rgba(41,44,68,0.035)]"
    >
      <div className="flex flex-col gap-3 border-b border-[#e8eaf1] bg-[linear-gradient(105deg,#f7f8ff_0%,#ffffff_62%)] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#4f46e5] text-white shadow-[0_5px_12px_rgba(79,70,229,0.22)]">
            <History aria-hidden="true" className="size-3.5" />
          </span>
          <div>
            <p className="text-[10px] font-semibold tracking-[0.11em] text-[#5750c8] uppercase">
              분석 흐름
            </p>
            <h2 className="mt-0.5 text-[14px] font-semibold tracking-[-0.02em] text-[#242735]">
              분석 버전 기록
            </h2>
          </div>
        </div>
        <p className="rounded-md border border-[#dfe2ed] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#676b7a]">
          {versions.length}개 버전 · 선택해 다시 보기
        </p>
      </div>

      <ol className="grid gap-2.5 p-3 sm:grid-cols-2 lg:grid-cols-3">
        {versions.map((version) => {
          const { entry } = version;
          const context = entry.response.context;
          const isActive = entry.response.analysisId === activeAnalysisId;

          return (
            <li key={entry.id}>
              <button
                aria-current={isActive ? "step" : undefined}
                className={`group relative flex min-h-40 w-full flex-col rounded-lg border p-3.5 text-left transition-[border-color,box-shadow,transform] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f46e5] motion-reduce:transition-none ${
                  isActive
                    ? "border-[#625cf0] bg-[#f4f4ff] shadow-[0_8px_20px_rgba(79,70,229,0.1)]"
                    : "border-[#e4e6ec] bg-white hover:-translate-y-0.5 hover:border-[#aaa6ff] hover:shadow-[0_8px_20px_rgba(41,44,68,0.08)]"
                }`}
                disabled={isActive}
                onClick={() => onSelectVersion(entry)}
                type="button"
              >
                <div className="flex w-full items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.1em] text-[#4f46e5] uppercase">
                    <span className="grid size-5 place-items-center rounded bg-white font-mono text-[9px] shadow-[0_1px_2px_rgba(41,44,68,0.08)]">
                      {version.version}
                    </span>
                    버전
                  </span>
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#4f46e5] px-2 py-1 text-[9px] font-semibold text-white">
                      <Check aria-hidden="true" className="size-2.5" />
                      현재
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#595e6b] group-hover:text-[#4f46e5]">
                      <RotateCcw aria-hidden="true" className="size-3" />
                      열기
                    </span>
                  )}
                </div>
                <p className="mt-3 line-clamp-2 text-[12px] leading-5 font-medium text-[#242735]">
                  {entry.question}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded bg-white/80 px-1.5 py-1 text-[9px] font-medium text-[#595e6b]">
                    {getAnalysisVersionPeriodLabel(context)}
                  </span>
                  <span className="rounded bg-white/80 px-1.5 py-1 text-[9px] font-medium text-[#595e6b]">
                    {metricCatalog[context.primaryMetric].label}
                  </span>
                  {context.compareWith !== "none" ? (
                    <span className="rounded bg-white/80 px-1.5 py-1 text-[9px] font-medium text-[#595e6b]">
                      {getComparisonLabel(context.compareWith)}
                    </span>
                  ) : null}
                  {context.filters.slice(0, 1).map((filter) => (
                    <span
                      className="max-w-32 truncate rounded bg-white/80 px-1.5 py-1 text-[9px] font-medium text-[#595e6b]"
                      key={`${filter.dimension}-${filter.operator}-${filter.values.join("-")}`}
                    >
                      {getDashboardContextFilterLabel(filter)}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex w-full items-end justify-between gap-2 pt-3">
                  <div className="flex flex-wrap gap-1">
                    {version.changes.map((change) => (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                          change.tone === "accent"
                            ? "bg-[#e6e5ff] text-[#4943c7]"
                            : "bg-[#eef0f4] text-[#676b7a]"
                        }`}
                        key={change.label}
                      >
                        {change.label}
                      </span>
                    ))}
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-0.5 text-[9px] text-[#777b88]">
                    {formatVersionTime(entry.createdAt)}
                    {!isActive ? (
                      <ChevronRight
                        aria-hidden="true"
                        className="size-3 text-[#7771e5]"
                      />
                    ) : null}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
