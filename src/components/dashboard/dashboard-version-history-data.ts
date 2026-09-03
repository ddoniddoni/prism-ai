import type { AnalysisContext } from "@/lib/ai/schemas/analysis-plan";
import type { AnalyticsFilter } from "@/lib/analytics/query-schema";
import type { AnalysisHistoryEntry } from "@/lib/history/local-analysis-history";

export const analysisPeriodLabels = {
  last7Days: "최근 7일",
  last30Days: "최근 30일",
  thisMonth: "이번 달",
  lastMonth: "지난달",
  last90Days: "최근 90일",
  thisQuarter: "이번 분기",
  lastQuarter: "지난 분기",
  thisYear: "올해",
  lastYear: "작년",
  custom: "직접 선택",
} as const;

export type DashboardVersionChange = {
  label: string;
  tone: "accent" | "neutral";
};

export type DashboardSessionVersion = {
  changes: readonly DashboardVersionChange[];
  entry: AnalysisHistoryEntry;
  version: number;
};

function getFilterSignature(filters: readonly AnalyticsFilter[]): string {
  return filters
    .map((filter) =>
      [filter.dimension, filter.operator, ...filter.values.toSorted()].join(
        "\u0001",
      ),
    )
    .toSorted()
    .join("\u0002");
}

function hasSamePeriod(
  left: AnalysisContext["period"],
  right: AnalysisContext["period"],
): boolean {
  return (
    left.preset === right.preset &&
    left.startDate === right.startDate &&
    left.endDate === right.endDate
  );
}

export function getAnalysisVersionChanges(
  entry: AnalysisHistoryEntry,
  previousEntry: AnalysisHistoryEntry | undefined,
): readonly DashboardVersionChange[] {
  if (!previousEntry) {
    return [{ label: "첫 분석", tone: "neutral" }];
  }

  const currentContext = entry.response.context;
  const previousContext = previousEntry.response.context;
  const changes: DashboardVersionChange[] = [];

  if (entry.question !== previousEntry.question) {
    changes.push({ label: "질문 변경", tone: "accent" });
  }

  if (!hasSamePeriod(currentContext.period, previousContext.period)) {
    changes.push({ label: "기간 변경", tone: "accent" });
  }

  if (currentContext.primaryMetric !== previousContext.primaryMetric) {
    changes.push({ label: "지표 변경", tone: "accent" });
  }

  if (currentContext.compareWith !== previousContext.compareWith) {
    changes.push({ label: "비교 기준 변경", tone: "accent" });
  }

  if (
    getFilterSignature(currentContext.filters) !==
    getFilterSignature(previousContext.filters)
  ) {
    changes.push({ label: "필터 변경", tone: "accent" });
  }

  return changes.length > 0
    ? changes
    : [{ label: "결과 새로고침", tone: "neutral" }];
}

export function getAnalysisVersionPeriodLabel(
  context: AnalysisContext,
): string {
  if (
    context.period.preset === "custom" &&
    context.period.startDate &&
    context.period.endDate
  ) {
    return `${context.period.startDate} ~ ${context.period.endDate}`;
  }

  return analysisPeriodLabels[context.period.preset];
}

export function getDashboardSessionVersions(
  entries: readonly AnalysisHistoryEntry[],
  sessionId: string,
): readonly DashboardSessionVersion[] {
  const sessionEntries = entries
    .filter((entry) => entry.response.sessionId === sessionId)
    .toSorted(
      (left, right) =>
        left.createdAt.localeCompare(right.createdAt) ||
        left.id.localeCompare(right.id),
    );

  return sessionEntries.map((entry, index) => ({
    changes: getAnalysisVersionChanges(entry, sessionEntries[index - 1]),
    entry,
    version: index + 1,
  }));
}
