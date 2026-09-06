"use client";

import { ArrowUpRight, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  removeAnalysisHistoryEntry,
  saveAnalysisHistory,
  type AnalysisHistoryEntry,
} from "@/lib/history/local-analysis-history";

import {
  notifyLocalAnalysisHistoryChange,
  useLocalAnalysisHistory,
} from "./use-local-analysis-history";

import { NativeSelect } from "@/components/ui/native-select";

import { getDashboardContextFilterLabel } from "../dashboard/dashboard-context-controls-data";
import { getPeriodLabel, getKoreanDisplayTitle } from "../dashboard/formatters";

import { metricCatalog } from "@/lib/analytics/metric-catalog";

type HistoryMode = "all" | "live" | "mock";

function getEntryTitle(entry: AnalysisHistoryEntry): string {
  return getKoreanDisplayTitle(
    entry.response.dashboard.title,
    `${metricCatalog[entry.response.context.primaryMetric].label} 분석 결과`,
  );
}

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

function getEntryMode(
  entry: AnalysisHistoryEntry,
): Exclude<HistoryMode, "all"> {
  return entry.response.meta.mockMode ? "mock" : "live";
}

function ModeBadge({ entry }: { entry: AnalysisHistoryEntry }) {
  const mode = getEntryMode(entry);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] uppercase ${
        mode === "live"
          ? "bg-[#e7f6ef] text-[#17835c]"
          : "bg-[#f2f4f6] text-[#595e6b]"
      }`}
    >
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${mode === "live" ? "bg-[#17835c]" : "bg-[#777587]"}`}
      />
      {mode === "live" ? "실시간 분석" : "로컬 분석"}
    </span>
  );
}

function HistoryLoadingRows() {
  return (
    <div className="overflow-hidden rounded-lg border border-[#dde2e8] bg-white p-5">
      <div className="prism-skeleton h-9 w-full rounded" />
      <div className="mt-5 space-y-4">
        {[0, 1, 2].map((row) => (
          <div className="flex items-center gap-5" key={row}>
            <div className="prism-skeleton h-10 flex-1 rounded" />
            <div className="prism-skeleton hidden h-7 w-28 rounded sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyHistory({ filtered }: { filtered: boolean }) {
  return (
    <section
      aria-labelledby="empty-history-title"
      className="rounded-lg border border-dashed border-[#c7cbd2] bg-white px-6 py-12 text-center"
    >
      <h2
        className="text-xl font-semibold tracking-[-0.025em] text-[#191c1e]"
        id="empty-history-title"
      >
        {filtered ? "조건에 맞는 분석이 없습니다." : "첫 분석을 시작해 보세요."}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-[13px] leading-6 text-[#595e6b]">
        {filtered
          ? "검색어 또는 모드 필터를 바꾸면 다른 기록을 확인할 수 있습니다."
          : "완성된 분석은 이 브라우저에 안전하게 저장되고, 당시의 검증된 결과로 다시 열립니다."}
      </p>
      {!filtered ? (
        <Link
          className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-[#4f46e5] px-4 text-[13px] font-semibold text-white hover:bg-[#3f37c9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f46e5]"
          href="/"
        >
          새 분석 시작
        </Link>
      ) : null}
    </section>
  );
}

export function RecentAnalysisList() {
  const { entries, isReady } = useLocalAnalysisHistory();

  if (!isReady) {
    return (
      <div className="mt-4">
        <HistoryLoadingRows />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="mt-4">
        <EmptyHistory filtered={false} />
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-[#dde2e8]">
      {entries.slice(0, 3).map((entry) => (
        <Link
          className="group flex items-center gap-4 border-b border-[#dde2e8] px-2 py-4 transition-colors duration-100 hover:bg-[#f2f4f6]"
          href={createHistoryHref(entry)}
          key={entry.id}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#eef2ff] text-[#4f46e5]">
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-[#191c1e]">
              {getEntryTitle(entry)}
            </span>
            <span className="mt-1 block truncate text-[12px] text-[#595e6b]">
              {entry.question}
            </span>
          </span>
          <span className="hidden text-[11px] text-[#777587] sm:block">
            {formatSavedAt(entry.createdAt)}
          </span>
        </Link>
      ))}
    </div>
  );
}

export function HistoryList() {
  const { entries, isReady } = useLocalAnalysisHistory();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<HistoryMode>("all");
  const [lastRemovedEntry, setLastRemovedEntry] =
    useState<AnalysisHistoryEntry | null>(null);
  const [historyStatus, setHistoryStatus] = useState("");
  const undoTimeoutId = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (undoTimeoutId.current !== null) {
        window.clearTimeout(undoTimeoutId.current);
      }
    },
    [],
  );

  function clearUndoTimeout() {
    if (undoTimeoutId.current === null) {
      return;
    }

    window.clearTimeout(undoTimeoutId.current);
    undoTimeoutId.current = null;
  }

  function handleRemove(entry: AnalysisHistoryEntry) {
    clearUndoTimeout();
    removeAnalysisHistoryEntry(window.localStorage, entry.id);
    notifyLocalAnalysisHistoryChange();
    setLastRemovedEntry(entry);
    setHistoryStatus(`${getEntryTitle(entry)} 기록을 삭제했습니다.`);
    undoTimeoutId.current = window.setTimeout(() => {
      setLastRemovedEntry(null);
      undoTimeoutId.current = null;
    }, 8000);
  }

  function restoreLastRemovedEntry() {
    if (!lastRemovedEntry) {
      return;
    }

    clearUndoTimeout();
    saveAnalysisHistory(window.localStorage, lastRemovedEntry);
    notifyLocalAnalysisHistoryChange();
    setHistoryStatus(`${getEntryTitle(lastRemovedEntry)} 기록을 복원했습니다.`);
    setLastRemovedEntry(null);
  }

  const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");
  const visibleEntries = entries.filter((entry) => {
    const matchesMode = mode === "all" || getEntryMode(entry) === mode;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      entry.question.toLocaleLowerCase("ko-KR").includes(normalizedQuery) ||
      getEntryTitle(entry).toLocaleLowerCase("ko-KR").includes(normalizedQuery);

    return matchesMode && matchesQuery;
  });

  return (
    <section aria-label="저장된 분석 기록" className="mt-8">
      <p aria-live="polite" className="sr-only" role="status">
        {historyStatus}
      </p>
      {lastRemovedEntry ? (
        <div className="mb-3 flex flex-col gap-2 rounded-lg border border-[#c3c0ff] bg-[#eef2ff] px-4 py-3 text-[12px] text-[#3525cd] sm:flex-row sm:items-center sm:justify-between">
          <p>{getEntryTitle(lastRemovedEntry)} 기록을 삭제했습니다.</p>
          <button
            className="min-h-11 self-start rounded-md border border-[#a8a3ff] bg-white px-3 text-[12px] font-semibold text-[#3525cd] hover:bg-[#f8f9fb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f46e5] sm:self-auto"
            onClick={restoreLastRemovedEntry}
            type="button"
          >
            실행 취소
          </button>
        </div>
      ) : null}
      <div className="overflow-hidden rounded-lg border border-[#dde2e8] bg-white">
        <div className="grid gap-3 border-b border-[#dde2e8] bg-[#f8f9fb] px-4 py-4 sm:grid-cols-[minmax(0,1fr)_10rem] sm:items-end sm:gap-4 sm:px-6">
          <label className="grid min-w-0 gap-1.5">
            <span className="text-[12px] font-medium text-[#595e6b]">
              분석 기록 검색
            </span>
            <span className="relative block">
              <Search
                aria-hidden="true"
                className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#777587]"
              />
              <input
                autoComplete="off"
                className="h-11 w-full rounded-lg border border-[#dde2e8] bg-white pr-3 pl-9 text-[13px] text-[#191c1e] outline-none placeholder:text-[#9296a0] focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10"
                id="history-search"
                name="history-search"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="질문이나 분석 제목 검색…"
                type="search"
                value={query}
              />
            </span>
          </label>
          <label className="grid min-w-0 gap-1.5 text-[12px] font-medium text-[#595e6b]">
            <span>분석 모드</span>
            <NativeSelect
              name="history-mode"
              onChange={(event) => {
                const value = event.target.value;
                if (value === "all" || value === "live" || value === "mock")
                  setMode(value);
              }}
              value={mode}
            >
              <option value="all">전체</option>
              <option value="live">제미나이</option>
              <option value="mock">로컬 분석</option>
            </NativeSelect>
          </label>
        </div>

        {!isReady ? (
          <HistoryLoadingRows />
        ) : visibleEntries.length === 0 ? (
          <div className="p-5">
            <EmptyHistory filtered={entries.length > 0} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-left">
              <caption className="sr-only">저장된 분석 기록</caption>
              <thead>
                <tr className="border-b border-[#dde2e8] bg-[#f2f4f6] text-[10px] font-semibold tracking-[0.09em] text-[#595e6b] uppercase">
                  <th className="w-5/12 px-6 py-3 font-semibold">분석 제목</th>
                  <th className="w-3/12 px-6 py-3 font-semibold">분석 조건</th>
                  <th className="w-2/12 px-6 py-3 font-semibold">생성 시각</th>
                  <th className="w-2/12 px-6 py-3 text-right font-semibold">
                    분석 모드
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleEntries.map((entry) => {
                  const firstFilter =
                    entry.response.dashboard.context.filters[0];

                  return (
                    <tr
                      className="border-b border-[#dde2e8] last:border-b-0 hover:bg-[#f8f9fb]"
                      key={entry.id}
                    >
                      <td className="px-6 py-4 align-middle">
                        <Link
                          className="block font-medium text-[#191c1e] hover:text-[#4f46e5]"
                          href={createHistoryHref(entry)}
                        >
                          {getEntryTitle(entry)}
                        </Link>
                        <p className="mt-1 max-w-md truncate text-[12px] text-[#595e6b]">
                          {entry.question}
                        </p>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="flex flex-wrap gap-1.5">
                          <span className="rounded bg-[#dee2f2] px-2 py-1 text-[10px] font-medium text-[#424753]">
                            {getPeriodLabel(entry.response.context.period)}
                          </span>
                          {firstFilter ? (
                            <span className="max-w-32 truncate rounded bg-[#f2f4f6] px-2 py-1 text-[10px] font-medium text-[#595e6b]">
                              {getDashboardContextFilterLabel(firstFilter)}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[12px] text-[#595e6b]">
                        {formatSavedAt(entry.createdAt)}
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center justify-end gap-2">
                          <ModeBadge entry={entry} />
                          <button
                            aria-label={`${entry.question} 기록 삭제`}
                            className="grid size-11 place-items-center rounded text-[#9296a0] hover:bg-[#ffdad6] hover:text-[#ba1a1a] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#4f46e5]"
                            onClick={() => handleRemove(entry)}
                            type="button"
                          >
                            <Trash2 aria-hidden="true" className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div
          aria-live="polite"
          className="border-t border-[#dde2e8] bg-[#f8f9fb] px-6 py-3 text-[11px] text-[#595e6b]"
        >
          {isReady
            ? `전체 ${entries.length}개 중 ${visibleEntries.length}개 분석`
            : "분석 기록을 불러오는 중…"}
        </div>
      </div>
    </section>
  );
}
