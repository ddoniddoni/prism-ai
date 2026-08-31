import { z } from "zod";

const optionalSecret = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().min(1).optional(),
);

const environmentSchema = z
  .object({
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
    DATA_SOURCE: z.enum(["local", "supabase"]).default("local"),
    AI_PROVIDER: z.enum(["mock", "gemini"]).default("mock"),
    GEMINI_API_KEY: optionalSecret,
    GEMINI_MODEL: optionalSecret,
    AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(12_000),
    AI_MAX_CALLS_PER_ANALYSIS: z.coerce.number().int().min(1).max(2).default(2),
    DEMO_DAILY_LIMIT: z.coerce.number().int().nonnegative().default(10),
    NEXT_PUBLIC_SUPABASE_URL: optionalSecret,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalSecret,
    SUPABASE_SECRET_KEY: optionalSecret,
  })
  .superRefine((environment, context) => {
    if (
      environment.AI_PROVIDER === "gemini" &&
      (!environment.GEMINI_API_KEY || !environment.GEMINI_MODEL)
    ) {
      context.addIssue({
        code: "custom",
        message:
          "AI_PROVIDER=gemini requires GEMINI_API_KEY and GEMINI_MODEL on the server.",
        path: ["AI_PROVIDER"],
      });
    }
  });

export type AppEnvironment = z.infer<typeof environmentSchema>;

export function parseEnvironment(
  input: Record<string, string | undefined> = process.env,
): AppEnvironment {
  return environmentSchema.parse(input);
}

export const env = parseEnvironment();
