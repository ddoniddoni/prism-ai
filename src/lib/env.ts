import { z } from "zod";

const optionalSecret = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().min(1).optional(),
);

const environmentSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  DATA_SOURCE: z.enum(["local", "supabase"]).default("local"),
  AI_PROVIDER: z.enum(["mock", "gemini"]).default("mock"),
  GEMINI_API_KEY: optionalSecret,
  GEMINI_MODEL: optionalSecret,
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(12_000),
  AI_MAX_CALLS_PER_ANALYSIS: z.coerce.number().int().min(2).max(4).default(4),
  DEMO_DAILY_LIMIT: z.coerce.number().int().nonnegative().default(10),
  NEXT_PUBLIC_SUPABASE_URL: optionalSecret,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalSecret,
  SUPABASE_SECRET_KEY: optionalSecret,
});

export type AppEnvironment = z.infer<typeof environmentSchema>;

export function parseEnvironment(
  input: Record<string, string | undefined> = process.env,
): AppEnvironment {
  return environmentSchema.parse(input);
}

export function isGeminiConfigured(
  environment: AppEnvironment,
): environment is AppEnvironment & {
  GEMINI_API_KEY: string;
  GEMINI_MODEL: string;
} {
  return Boolean(environment.GEMINI_API_KEY && environment.GEMINI_MODEL);
}

export const env = parseEnvironment();
