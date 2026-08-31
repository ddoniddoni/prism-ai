"use client";

import Link from "next/link";

import {
  removeAnalysisHistoryEntry,
  type AnalysisHistoryEntry,
} from "@/lib/history/local-analysis-history";

import {
  notifyLocalAnalysisHistoryChange,
  useLocalAnalysisHistory,
} from "./use-local-analysis-history";

function formatSavedAt(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function createHistoryHref(entry: AnalysisHistoryEntry): string {
  const searchParams = new URLSearchParams({
    question: entry.question,
    historyId: entry.id,
  });

  return `/dashboard/${encodeURIComponent(entry.response.dashboard.id)}?${searchParams.toString()}`;
}

export function HistoryList() {
  const { entries } = useLocalAnalysisHistory();

  function handleRemove(id: string) {
    removeAnalysisHistoryEntry(window.localStorage, id);
    notifyLocalAnalysisHistoryChange();
  }

  if (entries.length === 0) {
    return (
      <section
        aria-labelledby="empty-history-title"
        className="mt-12 border border-dashed border-slate-900/20 bg-white/60 p-8 sm:p-12"
      >
        <p className="font-mono text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">
          No saved analysis
        </p>
        <h2
          className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[#151a2d]"
          id="empty-history-title"
        >
          첫 질문으로 분석 기록을 시작하세요.
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
          완성된 분석만 이 브라우저에 저장합니다. 저장된 결과는 다시 열어도 서버
          요청 없이 검증된 당시 결과를 그대로 표시합니다.
        </p>
        <Link
          className="mt-7 inline-flex bg-[#151a2d] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6657dd] focus-visible:ring-2 focus-visible:ring-[#6657dd] focus-visible:ring-offset-2 focus-visible:outline-none"
          href="/"
        >
          질문 시작하기
        </Link>
      </section>
    );
  }

  return (
    <section aria-label="저장된 분석 기록" className="mt-12 space-y-3">
      {entries.map((entry) => (
        <article
          className="flex flex-col gap-4 border border-slate-900/10 bg-white p-5 shadow-[0_18px_45px_-38px_rgba(21,26,45,0.72)] sm:flex-row sm:items-start sm:justify-between"
          key={entry.id}
        >
          <div>
            <p className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#6657dd] uppercase">
              {formatSavedAt(entry.createdAt)}
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em] text-[#151a2d]">
              {entry.response.dashboard.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {entry.question}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              className="border border-[#6657dd]/30 px-3 py-2 text-sm font-semibold text-[#5144bb] transition-colors hover:border-[#6657dd] hover:bg-[#f0efff] focus-visible:ring-2 focus-visible:ring-[#6657dd] focus-visible:ring-offset-2 focus-visible:outline-none"
              href={createHistoryHref(entry)}
            >
              다시 열기
            </Link>
            <button
              aria-label={`${entry.question} 기록 삭제`}
              className="px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:text-rose-700 focus-visible:ring-2 focus-visible:ring-[#6657dd] focus-visible:ring-offset-2 focus-visible:outline-none"
              onClick={() => handleRemove(entry.id)}
              type="button"
            >
              삭제
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
