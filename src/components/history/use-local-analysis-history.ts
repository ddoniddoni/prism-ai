"use client";

import { useSyncExternalStore } from "react";

import {
  ANALYSIS_HISTORY_STORAGE_KEY,
  readAnalysisHistory,
  type AnalysisHistoryEntry,
} from "@/lib/history/local-analysis-history";

const historyChangeEvent = "prism-ai:analysis-history-change";
const serverHistorySnapshot: AnalysisHistoryEntry[] = [];
const unavailableClientHistorySnapshot: AnalysisHistoryEntry[] = [];
let cachedRawHistory: string | null | undefined;
let cachedHistory = serverHistorySnapshot;

function readClientHistorySnapshot(): AnalysisHistoryEntry[] {
  let rawHistory: string | null;

  try {
    rawHistory = window.localStorage.getItem(ANALYSIS_HISTORY_STORAGE_KEY);
  } catch {
    if (cachedHistory === serverHistorySnapshot) {
      cachedHistory = unavailableClientHistorySnapshot;
    }

    return cachedHistory;
  }

  if (rawHistory === cachedRawHistory) {
    return cachedHistory;
  }

  cachedRawHistory = rawHistory;
  cachedHistory = readAnalysisHistory(window.localStorage);

  return cachedHistory;
}

function subscribeToHistoryChanges(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(historyChangeEvent, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(historyChangeEvent, callback);
  };
}

function getServerHistorySnapshot(): AnalysisHistoryEntry[] {
  return serverHistorySnapshot;
}

export function useLocalAnalysisHistory(): {
  entries: readonly AnalysisHistoryEntry[];
  isReady: boolean;
} {
  const entries = useSyncExternalStore(
    subscribeToHistoryChanges,
    readClientHistorySnapshot,
    getServerHistorySnapshot,
  );

  return {
    entries,
    isReady: entries !== serverHistorySnapshot,
  };
}

export function notifyLocalAnalysisHistoryChange(): void {
  window.dispatchEvent(new Event(historyChangeEvent));
}
