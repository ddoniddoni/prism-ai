import localAnalyticsDailyRows from "@/data/analytics-daily.json";
import { describe, expect, it } from "vitest";

import {
  LOCAL_DATASET_END_DATE,
  LOCAL_DATASET_START_DATE,
  LOCAL_DATASET_VERSION,
  generateAnalyticsDailyRows,
} from "./generate-local-data";
import { LocalAnalyticsRepository } from "./local-repository";

describe("LocalAnalyticsRepository", () => {
  it("loads the generated dataset with its range and version metadata", async () => {
    const repository = new LocalAnalyticsRepository();

    await expect(repository.getDataRange()).resolves.toEqual({
      minDate: LOCAL_DATASET_START_DATE,
      maxDate: LOCAL_DATASET_END_DATE,
    });
    await expect(repository.getDatasetVersion()).resolves.toBe(
      LOCAL_DATASET_VERSION,
    );
    await expect(repository.getRows()).resolves.toHaveLength(10_935);
  });

  it("keeps the committed data file in sync with the deterministic generator", () => {
    expect(localAnalyticsDailyRows).toEqual(generateAnalyticsDailyRows());
  });
});
