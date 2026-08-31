import { z } from "zod";

import { metricKeys } from "@/lib/analytics/metric-catalog";

import { analysisContextSchema } from "./analysis-plan";

export const widgetTypes = [
  "metric",
  "timeSeries",
  "categoryBar",
  "donut",
  "rankingTable",
  "dataTable",
  "insight",
] as const;

export const widgetSizes = ["small", "medium", "large", "full"] as const;

const widgetReferenceSchema = z
  .object({
    id: z.string().trim().min(1).max(100),
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().min(1).max(240).optional(),
    queryIds: z.array(z.string().trim().min(1)).max(8),
    findingIds: z.array(z.string().trim().min(1)).max(8),
    size: z.enum(widgetSizes),
  })
  .strict();

const metricWidgetSchema = widgetReferenceSchema
  .extend({
    type: z.literal("metric"),
    config: z
      .object({
        queryId: z.string().trim().min(1),
        metric: z.enum(metricKeys),
      })
      .strict(),
  })
  .strict();

const timeSeriesWidgetSchema = widgetReferenceSchema
  .extend({
    type: z.literal("timeSeries"),
    config: z
      .object({
        queryId: z.string().trim().min(1),
        xKey: z.literal("label"),
      })
      .strict(),
  })
  .strict();

const categoryBarWidgetSchema = widgetReferenceSchema
  .extend({
    type: z.literal("categoryBar"),
    config: z
      .object({
        queryId: z.string().trim().min(1),
        orientation: z.enum(["horizontal", "vertical"]),
      })
      .strict(),
  })
  .strict();

const donutWidgetSchema = widgetReferenceSchema
  .extend({
    type: z.literal("donut"),
    config: z.object({ queryId: z.string().trim().min(1) }).strict(),
  })
  .strict();

const rankingTableWidgetSchema = widgetReferenceSchema
  .extend({
    type: z.literal("rankingTable"),
    config: z.object({ queryId: z.string().trim().min(1) }).strict(),
  })
  .strict();

const dataTableWidgetSchema = widgetReferenceSchema
  .extend({
    type: z.literal("dataTable"),
    config: z.object({ queryId: z.string().trim().min(1) }).strict(),
  })
  .strict();

const insightWidgetSchema = widgetReferenceSchema
  .extend({
    type: z.literal("insight"),
    config: z
      .object({
        findingId: z.string().trim().min(1),
        tone: z.enum(["neutral", "positive", "warning", "critical"]),
      })
      .strict(),
  })
  .strict();

export const dashboardWidgetSchema = z.discriminatedUnion("type", [
  metricWidgetSchema,
  timeSeriesWidgetSchema,
  categoryBarWidgetSchema,
  donutWidgetSchema,
  rankingTableWidgetSchema,
  dataTableWidgetSchema,
  insightWidgetSchema,
]);

export const dashboardSpecSchema = z
  .object({
    id: z.string().trim().min(1).max(120),
    title: z.string().trim().min(1).max(120),
    subtitle: z.string().trim().min(1).max(240),
    summary: z.string().trim().min(1).max(360),
    context: analysisContextSchema,
    widgets: z.array(dashboardWidgetSchema).min(1).max(8),
  })
  .strict();

export type DashboardWidget = z.infer<typeof dashboardWidgetSchema>;
export type DashboardSpec = z.infer<typeof dashboardSpecSchema>;
