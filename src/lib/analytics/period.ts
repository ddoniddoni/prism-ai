import type { AnalyticsDataRange } from "@/lib/data/repository";

import type {
  AnalyticsPeriod,
  CompareMode,
  PeriodPreset,
} from "./query-schema";

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1_000;

export type ResolvedPeriod = {
  startDate: string;
  endDate: string;
};

export class AnalyticsPeriodError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalyticsPeriodError";
  }
}

function toUtcDate(date: string): Date {
  const parts = date.split("-").map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  if (!year || !month || !day) {
    throw new AnalyticsPeriodError("유효한 YYYY-MM-DD 날짜가 필요합니다.");
  }

  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    throw new AnalyticsPeriodError("존재하지 않는 날짜입니다.");
  }

  return parsedDate;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, amount: number): Date {
  return new Date(date.getTime() + amount * DAY_IN_MILLISECONDS);
}

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

function startOfQuarter(date: Date): Date {
  const quarterStartMonth = Math.floor(date.getUTCMonth() / 3) * 3;

  return new Date(Date.UTC(date.getUTCFullYear(), quarterStartMonth, 1));
}

function endOfQuarter(date: Date): Date {
  const quarterStartMonth = Math.floor(date.getUTCMonth() / 3) * 3;

  return new Date(Date.UTC(date.getUTCFullYear(), quarterStartMonth + 3, 0));
}

function shiftMonths(date: Date, amount: number): Date {
  const targetMonth = date.getUTCMonth() + amount;
  const targetYear = date.getUTCFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const daysInTargetMonth = new Date(
    Date.UTC(targetYear, normalizedMonth + 1, 0),
  ).getUTCDate();

  return new Date(
    Date.UTC(
      targetYear,
      normalizedMonth,
      Math.min(date.getUTCDate(), daysInTargetMonth),
    ),
  );
}

function shiftYears(date: Date, amount: number): Date {
  const targetYear = date.getUTCFullYear() + amount;
  const daysInTargetMonth = new Date(
    Date.UTC(targetYear, date.getUTCMonth() + 1, 0),
  ).getUTCDate();

  return new Date(
    Date.UTC(
      targetYear,
      date.getUTCMonth(),
      Math.min(date.getUTCDate(), daysInTargetMonth),
    ),
  );
}

function resolvePresetPeriod(
  preset: Exclude<PeriodPreset, "custom">,
  referenceDate: Date,
): ResolvedPeriod {
  switch (preset) {
    case "last7Days":
      return {
        startDate: toIsoDate(addDays(referenceDate, -6)),
        endDate: toIsoDate(referenceDate),
      };
    case "last30Days":
      return {
        startDate: toIsoDate(addDays(referenceDate, -29)),
        endDate: toIsoDate(referenceDate),
      };
    case "thisMonth":
      return {
        startDate: toIsoDate(startOfMonth(referenceDate)),
        endDate: toIsoDate(referenceDate),
      };
    case "lastMonth": {
      const previousMonth = shiftMonths(referenceDate, -1);

      return {
        startDate: toIsoDate(startOfMonth(previousMonth)),
        endDate: toIsoDate(endOfMonth(previousMonth)),
      };
    }
    case "last90Days":
      return {
        startDate: toIsoDate(addDays(referenceDate, -89)),
        endDate: toIsoDate(referenceDate),
      };
    case "thisQuarter":
      return {
        startDate: toIsoDate(startOfQuarter(referenceDate)),
        endDate: toIsoDate(referenceDate),
      };
    case "lastQuarter": {
      const previousQuarter = addDays(startOfQuarter(referenceDate), -1);

      return {
        startDate: toIsoDate(startOfQuarter(previousQuarter)),
        endDate: toIsoDate(endOfQuarter(previousQuarter)),
      };
    }
    case "thisYear":
      return {
        startDate: `${referenceDate.getUTCFullYear()}-01-01`,
        endDate: toIsoDate(referenceDate),
      };
    case "lastYear": {
      const previousYear = referenceDate.getUTCFullYear() - 1;

      return {
        startDate: `${previousYear}-01-01`,
        endDate: `${previousYear}-12-31`,
      };
    }
  }
}

function ensurePeriodOrder(period: ResolvedPeriod): void {
  if (period.startDate > period.endDate) {
    throw new AnalyticsPeriodError("종료일은 시작일보다 빠를 수 없습니다.");
  }
}

function ensurePeriodIntersectsDataRange(
  period: ResolvedPeriod,
  dataRange: AnalyticsDataRange | undefined,
): void {
  if (
    dataRange &&
    (period.endDate < dataRange.minDate || period.startDate > dataRange.maxDate)
  ) {
    throw new AnalyticsPeriodError(
      "요청한 기간에 사용할 수 있는 데이터가 없습니다.",
    );
  }
}

export function resolvePeriod(
  period: AnalyticsPeriod,
  referenceDate: string,
  dataRange?: AnalyticsDataRange,
): ResolvedPeriod {
  const reference = toUtcDate(referenceDate);
  const resolved =
    period.preset === "custom"
      ? {
          startDate: period.startDate ?? "",
          endDate: period.endDate ?? "",
        }
      : resolvePresetPeriod(period.preset, reference);

  toUtcDate(resolved.startDate);
  toUtcDate(resolved.endDate);
  ensurePeriodOrder(resolved);
  ensurePeriodIntersectsDataRange(resolved, dataRange);

  return resolved;
}

export function resolveComparisonPeriod(
  period: ResolvedPeriod,
  compareWith: CompareMode,
): ResolvedPeriod | undefined {
  if (compareWith === "none") {
    return undefined;
  }

  const startDate = toUtcDate(period.startDate);
  const endDate = toUtcDate(period.endDate);

  if (compareWith === "previousPeriod") {
    const dayCount =
      Math.round(
        (endDate.getTime() - startDate.getTime()) / DAY_IN_MILLISECONDS,
      ) + 1;
    const comparisonEnd = addDays(startDate, -1);

    return {
      startDate: toIsoDate(addDays(comparisonEnd, -(dayCount - 1))),
      endDate: toIsoDate(comparisonEnd),
    };
  }

  if (compareWith === "previousMonth") {
    return {
      startDate: toIsoDate(shiftMonths(startDate, -1)),
      endDate: toIsoDate(shiftMonths(endDate, -1)),
    };
  }

  return {
    startDate: toIsoDate(shiftYears(startDate, -1)),
    endDate: toIsoDate(shiftYears(endDate, -1)),
  };
}
