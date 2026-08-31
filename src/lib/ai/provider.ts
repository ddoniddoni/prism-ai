import type { AnalyticsDataset } from "@/lib/analytics/query-engine";
import type { Finding } from "@/lib/analytics/findings";

import type { AnalysisContext, AnalysisPlan } from "./schemas/analysis-plan";
import type { DashboardSpec } from "./schemas/dashboard-spec";

export type PlannerInput = {
  question: string;
  currentContext?: AnalysisContext;
};

export type DashboardComposerInput = {
  dashboardId: string;
  plan: AnalysisPlan;
  context: AnalysisContext;
  datasets: readonly AnalyticsDataset[];
  findings: readonly Finding[];
};

export interface AIProvider {
  createPlan(input: PlannerInput): Promise<AnalysisPlan>;
  createDashboard(input: DashboardComposerInput): Promise<DashboardSpec>;
}
