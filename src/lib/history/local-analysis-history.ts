import { z } from "zod";

import {
  analyzeResponseSchema,
  type AnalyzeResponse,
} from "@/lib/analysis/schemas";

export const ANALYSIS_HISTORY_STORAGE_KEY = "prism-ai:analysis-history:v1";
export const ANALYSIS_HISTORY_LIMIT = 20;

export type LocalStorageLike = Pick<Storage, "getItem" | "setItem">;

export const analysisHistoryEntrySchema = z
  .object({
    id: z.string().trim().min(1).max(160),
    createdAt: z.string().datetime(),
    question: z.string().trim().min(2).max(300),
    response: analyzeResponseSchema,
  })
  .strict();

const analysisHistorySchema = z
  .array(analysisHistoryEntrySchema)
  .max(ANALYSIS_HISTORY_LIMIT);

export type AnalysisHistoryEntry = z.infer<typeof analysisHistoryEntrySchema>;

function parseStoredHistory(rawHistory: string | null): AnalysisHistoryEntry[] {
  if (!rawHistory) {
    return [];
  }

  try {
    const payload: unknown = JSON.parse(rawHistory);
    const result = analysisHistorySchema.safeParse(payload);

    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

export function readAnalysisHistory(
  storage: Pick<LocalStorageLike, "getItem">,
): AnalysisHistoryEntry[] {
  try {
    return parseStoredHistory(storage.getItem(ANALYSIS_HISTORY_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function saveAnalysisHistory(
  storage: LocalStorageLike,
  entry: AnalysisHistoryEntry,
): AnalysisHistoryEntry[] {
  const validatedEntry = analysisHistoryEntrySchema.parse(entry);
  const history = readAnalysisHistory(storage).filter(
    (existingEntry) => existingEntry.id !== validatedEntry.id,
  );
  const nextHistory = [validatedEntry, ...history].slice(
    0,
    ANALYSIS_HISTORY_LIMIT,
  );

  try {
    storage.setItem(ANALYSIS_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
  } catch {
    return history;
  }

  return nextHistory;
}

export function findAnalysisHistoryEntry(
  storage: Pick<LocalStorageLike, "getItem">,
  id: string,
): AnalysisHistoryEntry | undefined {
  return readAnalysisHistory(storage).find((entry) => entry.id === id);
}

export function removeAnalysisHistoryEntry(
  storage: LocalStorageLike,
  id: string,
): AnalysisHistoryEntry[] {
  const nextHistory = readAnalysisHistory(storage).filter(
    (entry) => entry.id !== id,
  );

  try {
    storage.setItem(ANALYSIS_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
  } catch {
    return readAnalysisHistory(storage);
  }

  return nextHistory;
}

export function createAnalysisHistoryEntry(
  question: string,
  response: AnalyzeResponse,
): AnalysisHistoryEntry {
  return analysisHistoryEntrySchema.parse({
    id: response.analysisId,
    createdAt: new Date().toISOString(),
    question,
    response,
  });
}
