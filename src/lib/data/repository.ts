import { z } from "zod";

export const deviceSchema = z.enum(["desktop", "mobile", "tablet"]);

export const analyticsDailyRowSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  device: deviceSchema,
  category: z.string().min(1),
  product: z.string().min(1),
  trafficSource: z.string().min(1),
  region: z.string().min(1),
  customerSegment: z.string().min(1),
  campaign: z.string().min(1).nullable(),
  revenue: z.number().finite().nonnegative(),
  orders: z.number().int().nonnegative(),
  unitsSold: z.number().int().nonnegative(),
  customers: z.number().int().nonnegative(),
  sessions: z.number().int().nonnegative(),
  adSpend: z.number().finite().nonnegative(),
  attributedRevenue: z.number().finite().nonnegative(),
  refunds: z.number().int().nonnegative(),
});

export const analyticsDailyRowsSchema = z.array(analyticsDailyRowSchema).min(1);

export type AnalyticsDailyRow = z.infer<typeof analyticsDailyRowSchema>;

export type AnalyticsDataRange = {
  minDate: string;
  maxDate: string;
};

export interface AnalyticsRepository {
  getRows(): Promise<readonly AnalyticsDailyRow[]>;
  getDataRange(): Promise<AnalyticsDataRange>;
  getDatasetVersion(): Promise<string>;
}
