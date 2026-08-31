export const CONTRIBUTION_EPSILON = 1e-9;
export const ROLLING_Z_SCORE_MINIMUM_SAMPLE_SIZE = 7;
export const ROLLING_Z_SCORE_THRESHOLD = 2.5;

export type ChangeValues = {
  currentValue: number | null;
  previousValue: number | null;
};

export type RankingValue = {
  label: string;
  value: number | null;
};

export type DriverValue = ChangeValues & {
  label: string;
};

export type AnomalyValue = RankingValue & {
  index: number;
  zScore: number;
};

export function calculateAbsoluteChange(
  currentValue: number | null,
  previousValue: number | null,
): number | null {
  if (currentValue === null || previousValue === null) {
    return null;
  }

  return currentValue - previousValue;
}

export function calculatePercentChange(
  currentValue: number | null,
  previousValue: number | null,
): number | null {
  const absoluteChange = calculateAbsoluteChange(currentValue, previousValue);

  if (
    absoluteChange === null ||
    previousValue === null ||
    previousValue === 0
  ) {
    return null;
  }

  return (absoluteChange / Math.abs(previousValue)) * 100;
}

export function calculateContribution(
  currentValue: number | null,
  previousValue: number | null,
  currentTotal: number | null,
  previousTotal: number | null,
): number | null {
  const segmentDelta = calculateAbsoluteChange(currentValue, previousValue);
  const totalDelta = calculateAbsoluteChange(currentTotal, previousTotal);

  if (
    segmentDelta === null ||
    totalDelta === null ||
    Math.abs(totalDelta) < CONTRIBUTION_EPSILON
  ) {
    return null;
  }

  return (segmentDelta / totalDelta) * 100;
}

export function calculateRanking<T extends RankingValue>(
  values: readonly T[],
  direction: "asc" | "desc" = "desc",
): T[] {
  return [...values].sort((left, right) => {
    if (left.value === null && right.value === null) {
      return left.label.localeCompare(right.label);
    }

    if (left.value === null) {
      return 1;
    }

    if (right.value === null) {
      return -1;
    }

    const valueOrder =
      direction === "asc" ? left.value - right.value : right.value - left.value;

    return valueOrder === 0
      ? left.label.localeCompare(right.label)
      : valueOrder;
  });
}

export function findTopDrivers<T extends DriverValue>(
  values: readonly T[],
  currentTotal: number | null,
  previousTotal: number | null,
  limit = 3,
): Array<T & { absoluteChange: number; contributionPercent: number }> {
  const totalDelta = calculateAbsoluteChange(currentTotal, previousTotal);

  if (totalDelta === null || Math.abs(totalDelta) < CONTRIBUTION_EPSILON) {
    return [];
  }

  const direction = Math.sign(totalDelta);

  return values
    .map((value) => {
      const absoluteChange = calculateAbsoluteChange(
        value.currentValue,
        value.previousValue,
      );
      const contributionPercent = calculateContribution(
        value.currentValue,
        value.previousValue,
        currentTotal,
        previousTotal,
      );

      return { ...value, absoluteChange, contributionPercent };
    })
    .filter(
      (
        value,
      ): value is T & { absoluteChange: number; contributionPercent: number } =>
        value.absoluteChange !== null &&
        value.contributionPercent !== null &&
        value.absoluteChange * direction > CONTRIBUTION_EPSILON,
    )
    .sort((left, right) => {
      const contributionOrder =
        right.contributionPercent - left.contributionPercent;

      if (contributionOrder !== 0) {
        return contributionOrder;
      }

      return left.label.localeCompare(right.label);
    })
    .slice(0, limit);
}

/**
 * Uses a trailing seven-observation population standard deviation. A point is
 * anomalous only when at least seven earlier values exist and |z| >= 2.5.
 */
export function detectAnomalies<T extends RankingValue>(
  values: readonly T[],
): Array<T & AnomalyValue> {
  const anomalies: Array<T & AnomalyValue> = [];

  for (
    let index = ROLLING_Z_SCORE_MINIMUM_SAMPLE_SIZE;
    index < values.length;
    index += 1
  ) {
    const current = values[index];

    if (!current || current.value === null) {
      continue;
    }

    const window = values.slice(
      index - ROLLING_Z_SCORE_MINIMUM_SAMPLE_SIZE,
      index,
    );

    if (window.some((value) => value.value === null)) {
      continue;
    }

    const numericWindow = window.map((value) => value.value ?? 0);
    const mean =
      numericWindow.reduce((total, value) => total + value, 0) /
      numericWindow.length;
    const variance =
      numericWindow.reduce((total, value) => total + (value - mean) ** 2, 0) /
      numericWindow.length;
    const standardDeviation = Math.sqrt(variance);

    if (standardDeviation < CONTRIBUTION_EPSILON) {
      continue;
    }

    const zScore = (current.value - mean) / standardDeviation;

    if (Math.abs(zScore) >= ROLLING_Z_SCORE_THRESHOLD) {
      anomalies.push({ ...current, index, zScore });
    }
  }

  return anomalies;
}
