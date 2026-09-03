import type { Finding } from "@/lib/analytics/findings";
import type { DashboardWidget } from "@/lib/ai/schemas/dashboard-spec";

export type DashboardInsightEvidenceTarget = {
  queryIds: readonly string[];
  widgetId: string;
  widgetTitle: string;
};

export function getInsightEvidenceTargets(
  finding: Finding | undefined,
  widgets: readonly DashboardWidget[],
): readonly DashboardInsightEvidenceTarget[] {
  if (!finding) {
    return [];
  }

  const evidenceQueryIds = new Set(finding.evidenceQueryIds);

  return widgets.flatMap((widget) => {
    if (widget.type === "insight") {
      return [];
    }

    const queryIds = widget.queryIds.filter((queryId) =>
      evidenceQueryIds.has(queryId),
    );

    return queryIds.length > 0
      ? [
          {
            queryIds,
            widgetId: widget.id,
            widgetTitle: widget.title,
          },
        ]
      : [];
  });
}

export function getInsightEvidenceTargetsByWidgetId(
  widgets: readonly DashboardWidget[],
  findingsById: ReadonlyMap<string, Finding>,
): ReadonlyMap<string, readonly DashboardInsightEvidenceTarget[]> {
  const targetsByWidgetId = new Map<
    string,
    readonly DashboardInsightEvidenceTarget[]
  >();

  widgets.forEach((widget) => {
    if (widget.type !== "insight") {
      return;
    }

    const targets = getInsightEvidenceTargets(
      findingsById.get(widget.config.findingId),
      widgets,
    );

    if (targets.length > 0) {
      targetsByWidgetId.set(widget.id, targets);
    }
  });

  return targetsByWidgetId;
}
