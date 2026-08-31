import "server-only";

import { GoogleGenAI, type GenerateContentParameters } from "@google/genai";
import { z } from "zod";

import { createAnalysisPlanPrompt } from "./prompts/analysis-plan-prompt";
import { createDashboardComposerPrompt } from "./prompts/dashboard-composer-prompt";
import {
  consumeAICall,
  createAICallBudget,
  type AICallBudget,
  type AIProvider,
  type AIProviderMetadata,
  type DashboardComposerInput,
  type PlannerInput,
} from "./provider";
import { analysisPlanSchema, type AnalysisPlan } from "./schemas/analysis-plan";
import {
  dashboardSpecSchema,
  type DashboardSpec,
} from "./schemas/dashboard-spec";

const dashboardCompositionSchema = dashboardSpecSchema.omit({
  id: true,
  context: true,
});

export type GeminiModelClient = {
  models: {
    generateContent(
      parameters: GenerateContentParameters,
    ): Promise<{ readonly text?: string }>;
  };
};

export type GeminiProviderOptions = {
  apiKey: string;
  model: string;
  timeoutMs: number;
  maxCallsPerAnalysis: number;
  client?: GeminiModelClient;
};

type GeneratedDashboardComposition = z.infer<typeof dashboardCompositionSchema>;

type ResponseValidator<T> = (value: T) => string | undefined;

export type GeminiProviderErrorCode =
  "BUDGET_EXCEEDED" | "INVALID_RESPONSE" | "REQUEST_FAILED" | "TIMEOUT";

export class GeminiProviderError extends Error {
  constructor(
    readonly code: GeminiProviderErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "GeminiProviderError";
  }
}

function createJsonSchema(schema: z.ZodType): unknown {
  const { $schema: schemaVersion, ...jsonSchema } = z.toJSONSchema(schema);

  void schemaVersion;

  return jsonSchema;
}

function parseJsonText(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new GeminiProviderError(
      "INVALID_RESPONSE",
      "Gemini가 JSON 형식의 응답을 반환하지 않았습니다.",
    );
  }
}

function validateDashboardComposition(
  composition: GeneratedDashboardComposition,
): string | undefined {
  const displayTexts = [
    composition.title,
    composition.subtitle,
    composition.summary,
    ...composition.widgets.flatMap((widget) => [
      widget.title,
      ...(widget.description ? [widget.description] : []),
    ]),
  ];

  return displayTexts.some((text) => /\d/u.test(text))
    ? "Dashboard 표시 문구에 숫자를 포함할 수 없습니다."
    : undefined;
}

export class GeminiAIProvider implements AIProvider {
  readonly metadata: AIProviderMetadata;
  private readonly client: GeminiModelClient;

  constructor(private readonly options: GeminiProviderOptions) {
    this.client = options.client ?? new GoogleGenAI({ apiKey: options.apiKey });
    this.metadata = {
      provider: "gemini",
      model: options.model,
      mockMode: false,
      fallbackUsed: false,
    };
  }

  async createPlan(input: PlannerInput): Promise<AnalysisPlan> {
    return this.generateStructured(
      analysisPlanSchema,
      createAnalysisPlanPrompt(input),
      input.callBudget,
    );
  }

  async createDashboard(input: DashboardComposerInput): Promise<DashboardSpec> {
    const composition = await this.generateStructured(
      dashboardCompositionSchema,
      createDashboardComposerPrompt(input),
      input.callBudget,
      validateDashboardComposition,
    );

    return dashboardSpecSchema.parse({
      id: input.dashboardId,
      context: input.context,
      ...composition,
    });
  }

  private async generateStructured<T>(
    schema: z.ZodType<T>,
    prompt: string,
    callBudget: AICallBudget | undefined,
    validate?: ResponseValidator<T>,
  ): Promise<T> {
    const budget =
      callBudget ?? createAICallBudget(this.options.maxCallsPerAnalysis);
    let lastResponseError: GeminiProviderError | undefined;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const attemptPrompt =
        attempt === 0
          ? prompt
          : `${prompt}\n\nThe previous output failed validation. Return only a corrected JSON object that exactly follows the response schema.`;

      try {
        const rawResponse = await this.requestJson(
          attemptPrompt,
          schema,
          budget,
        );
        const parsedResponse = schema.safeParse(rawResponse);

        if (!parsedResponse.success) {
          lastResponseError = new GeminiProviderError(
            "INVALID_RESPONSE",
            "Gemini 응답이 허용된 Schema를 통과하지 못했습니다.",
          );
          continue;
        }

        const validationMessage = validate?.(parsedResponse.data);

        if (validationMessage) {
          lastResponseError = new GeminiProviderError(
            "INVALID_RESPONSE",
            validationMessage,
          );
          continue;
        }

        return parsedResponse.data;
      } catch (error) {
        if (
          error instanceof GeminiProviderError &&
          error.code === "INVALID_RESPONSE"
        ) {
          lastResponseError = error;
          continue;
        }

        throw error;
      }
    }

    throw (
      lastResponseError ??
      new GeminiProviderError(
        "INVALID_RESPONSE",
        "Gemini 응답을 검증하지 못했습니다.",
      )
    );
  }

  private async requestJson(
    prompt: string,
    schema: z.ZodType,
    callBudget: AICallBudget,
  ): Promise<unknown> {
    if (!consumeAICall(callBudget)) {
      throw new GeminiProviderError(
        "BUDGET_EXCEEDED",
        "분석당 Gemini 호출 한도를 초과했습니다.",
      );
    }

    const timeoutSignal = AbortSignal.timeout(this.options.timeoutMs);

    try {
      const response = await this.client.models.generateContent({
        model: this.options.model,
        contents: prompt,
        config: {
          abortSignal: timeoutSignal,
          responseMimeType: "application/json",
          responseJsonSchema: createJsonSchema(schema),
          temperature: 0,
        },
      });

      if (!response.text) {
        throw new GeminiProviderError(
          "INVALID_RESPONSE",
          "Gemini가 비어 있는 응답을 반환했습니다.",
        );
      }

      return parseJsonText(response.text);
    } catch (error) {
      if (error instanceof GeminiProviderError) {
        throw error;
      }

      throw new GeminiProviderError(
        timeoutSignal.aborted ? "TIMEOUT" : "REQUEST_FAILED",
        timeoutSignal.aborted
          ? "Gemini 응답 시간이 제한을 초과했습니다."
          : "Gemini 요청을 완료하지 못했습니다.",
      );
    }
  }
}
