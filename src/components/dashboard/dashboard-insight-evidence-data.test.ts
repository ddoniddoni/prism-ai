import { describe, expect, it } from "vitest";

import type { Finding } from "@/lib/analytics/findings";
import type { DashboardWidget } from "@/lib/ai/schemas/dashboard-spec";

import {
  getInsightEvidenceTargets,
  getInsightEvidenceTargetsByWidgetId,
} from "./dashboard-insight-evidence-data";

const finding: Finding = {
  id: "finding-device-driver",
  type: "driver",
  severity: "warning",
  metric: "revenue",
  dimension: "device",
  evidenceQueryIds: ["trend", "device"],
  fallbackText: "Mobile이 매출 감소의 주요 기여 항목입니다.",
};

const widgets: readonly DashboardWidget[] = [
  {
    id: "metric",
    type: "metric",
    title: "핵심 지표",
    queryIds: ["primary"],
    findingIds: [],
    size: "small",
    config: { queryId: "primary", metric: "revenue" },
  },
  {
    id: "trend",
    type: "timeSeries",
    title: "기간별 매출 추이",
    queryIds: ["trend"],
    findingIds: [],
    size: "large",
    config: { queryId: "trend", xKey: "label" },
  },
  {
    id: "device",
    type: "categoryBar",
    title: "디바이스별 매출",
    queryIds: ["device"],
    findingIds: [],
    size: "medium",
    config: { queryId: "device", orientation: "horizontal" },
  },
  {
    id: "insight",
    type: "insight",
    title: "계산된 핵심 근거",
    queryIds: ["trend", "device"],
    findingIds: ["finding-device-driver"],
    size: "medium",
    config: { findingId: "finding-device-driver", tone: "warning" },
  },
];

describe("dashboard insight evidence data", () => {
  it("links each verified evidence query to rendered non-insight widgets", () => {
    expect(getInsightEvidenceTargets(finding, widgets)).toEqual([
      {
        queryIds: ["trend"],
        widgetId: "trend",
        widgetTitle: "기간별 매출 추이",
      },
      {
        queryIds: ["device"],
        widgetId: "device",
        widgetTitle: "디바이스별 매출",
      },
    ]);
  });

  it("does not expose a target when no verified finding is available", () => {
    expect(getInsightEvidenceTargets(undefined, widgets)).toEqual([]);
  });

  it("builds evidence links only for insight widgets", () => {
    const targetsByWidgetId = getInsightEvidenceTargetsByWidgetId(
      widgets,
      new Map([[finding.id, finding]]),
    );

    expect([...targetsByWidgetId.keys()]).toEqual(["insight"]);
    expect(targetsByWidgetId.get("insight")).toHaveLength(2);
  });
});
