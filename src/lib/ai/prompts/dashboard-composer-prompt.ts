import type { DashboardComposerInput } from "../provider";

function serializePromptData(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function createDashboardComposerPrompt(
  input: DashboardComposerInput,
): string {
  const datasets = input.datasets.map((dataset) => ({
    queryId: dataset.queryId,
    metric: dataset.metric,
    groupBy: dataset.groupBy ?? null,
    empty: dataset.empty,
  }));
  const findings = input.findings.map((finding) => ({
    id: finding.id,
    type: finding.type,
    severity: finding.severity,
    dimension: finding.dimension ?? null,
    evidenceQueryIds: finding.evidenceQueryIds,
  }));

  return `
You are the Dashboard Composer for Prism AI, a generative analytics dashboard.

Return one JSON object that matches the supplied schema exactly. Do not return Markdown, SQL, JavaScript, HTML, JSX, explanations, or any numeric display value.

You only choose a concise non-numeric title, subtitle, summary, and widgets that reference the provided Dataset query IDs and Finding IDs. Do not create metrics, dimensions, Query IDs, Finding IDs, widget types, or business values. The application owns the dashboard ID and validated Context, so they are intentionally absent from your output schema.

<analysis-plan>
${serializePromptData(input.plan)}
</analysis-plan>

<validated-context>
${serializePromptData(input.context)}
</validated-context>

<available-datasets>
${serializePromptData(datasets)}
</available-datasets>

<available-findings>
${serializePromptData(findings)}
</available-findings>`;
}
