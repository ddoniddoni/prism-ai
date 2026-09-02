import { z } from "zod";

import { analyticsDatasetSchema } from "@/lib/analytics/query-engine";
import { analyticsFilterSchema } from "@/lib/analytics/query-schema";
import { findingSchema } from "@/lib/analytics/findings";
import {
  analysisContextSchema,
  analysisPlanSchema,
} from "@/lib/ai/schemas/analysis-plan";
import { dashboardSpecSchema } from "@/lib/ai/schemas/dashboard-spec";

export const drilldownFilterSchema = analyticsFilterSchema
  .extend({
    operator: z.literal("eq"),
    values: z.array(z.string().trim().min(1).max(120)).length(1),
  })
  .strict();

export const analyzeRequestSchema = z
  .object({
    question: z.string().trim().min(2).max(300),
    requestId: z.string().trim().min(8).max(120),
    sessionId: z.string().trim().min(1).max(120).optional(),
    dashboardId: z.string().trim().min(1).max(120).optional(),
    currentContext: analysisContextSchema.optional(),
    drilldownFilter: drilldownFilterSchema.optional(),
  })
  .strict()
  .superRefine((request, context) => {
    if (request.drilldownFilter && !request.currentContext) {
      context.addIssue({
        code: "custom",
        path: ["currentContext"],
        message: "선택값 후속 분석에는 현재 분석 Context가 필요합니다.",
      });
    }
  });

export const analyzeErrorResponseSchema = z
  .object({
    error: z
      .object({ code: z.string().min(1), message: z.string().min(1) })
      .strict(),
  })
  .strict();

export const analyzeResponseSchema = z
  .object({
    analysisId: z.string().min(1),
    sessionId: z.string().min(1),
    context: analysisContextSchema,
    plan: analysisPlanSchema,
    datasets: z.array(analyticsDatasetSchema),
    findings: z.array(findingSchema),
    dashboard: dashboardSpecSchema,
    assistantMessage: z.string().min(1),
    meta: z
      .object({
        provider: z.enum(["mock", "gemini"]),
        model: z.string().min(1).nullable(),
        mockMode: z.boolean(),
        cacheHit: z.boolean(),
        fallbackUsed: z.boolean(),
        partial: z.boolean(),
        durationMs: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type AnalyzeErrorResponse = z.infer<typeof analyzeErrorResponseSchema>;
export type AnalyzeResponse = z.infer<typeof analyzeResponseSchema>;
export type DrilldownFilter = z.infer<typeof drilldownFilterSchema>;
