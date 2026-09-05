import type { ReactNode } from "react";
import type { AnalyticsDataset } from "@/lib/analytics/query-engine";
import type { Finding } from "@/lib/analytics/findings";
import type { AnalyticsFilter } from "@/lib/analytics/query-schema";
import type { DashboardWidget } from "@/lib/ai/schemas/dashboard-spec";
import type { DashboardWidgetPresentation } from "@/stores/dashboard-layout";
import type { DashboardDrilldownSelection } from "../dashboard-drilldown-data";

export type DashboardWidgetProps = {
  activeDrilldown?: DashboardDrilldownSelection | null;
  widget: DashboardWidget;
  datasetsById: ReadonlyMap<string, AnalyticsDataset>;
  findingsById: ReadonlyMap<string, Finding>;
  cardClassName?: string;
  controls?: ReactNode;
  drilldownAnalysisDisabled?: boolean;
  onDrilldownChange?: (selection: DashboardDrilldownSelection | null) => void;
  onDrilldownAnalysis?: (filter: AnalyticsFilter) => void;
  presentation?: DashboardWidgetPresentation;
};
