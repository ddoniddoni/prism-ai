import { describe, expect, it } from "vitest";

import { AnalyzeQuestionService } from "@/lib/analysis/analyze-question-service";

import {
  ANALYSIS_HISTORY_LIMIT,
  ANALYSIS_HISTORY_STORAGE_KEY,
  createAnalysisHistoryEntry,
  findAnalysisHistoryEntry,
  readAnalysisHistory,
  saveAnalysisHistory,
  type LocalStorageLike,
} from "./local-analysis-history";

class MemoryStorage implements LocalStorageLike {
  private readonly entries = new Map<string, string>();

  getItem(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.entries.set(key, value);
  }
}

async function createResponse() {
  return new AnalyzeQuestionService().execute({
    question: "지난달 매출이 왜 감소했어?",
    requestId: "history-test-request",
  });
}

describe("local analysis history", () => {
  it("rejects malformed saved payloads before exposing them to the UI", () => {
    const storage = new MemoryStorage();
    storage.setItem(ANALYSIS_HISTORY_STORAGE_KEY, '{"unsafe":true}');

    expect(readAnalysisHistory(storage)).toEqual([]);
  });

  it("stores a validated response and finds it again for dashboard reopening", async () => {
    const storage = new MemoryStorage();
    const response = await createResponse();
    const entry = createAnalysisHistoryEntry(
      response.plan.normalizedQuestion,
      response,
    );

    saveAnalysisHistory(storage, entry);

    expect(
      findAnalysisHistoryEntry(storage, response.analysisId)?.response,
    ).toEqual(response);
  });

  it("keeps only the most recent twenty analyses", async () => {
    const storage = new MemoryStorage();
    const response = await createResponse();

    for (let index = 0; index <= ANALYSIS_HISTORY_LIMIT; index += 1) {
      saveAnalysisHistory(
        storage,
        createAnalysisHistoryEntry(`분석 질문 ${index}`, {
          ...response,
          analysisId: `analysis-history-${index}`,
        }),
      );
    }

    const history = readAnalysisHistory(storage);

    expect(history).toHaveLength(ANALYSIS_HISTORY_LIMIT);
    expect(history[0]?.id).toBe(`analysis-history-${ANALYSIS_HISTORY_LIMIT}`);
    expect(history.at(-1)?.id).toBe("analysis-history-1");
  });
});
