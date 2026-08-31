import { AnalyzeQuestionServiceError } from "@/lib/analysis/analyze-question-service";
import {
  AnalyzeRequestCoordinator,
  RateLimitExceededError,
} from "@/lib/analysis/analyze-request-coordinator";
import { getDemoClientIdentity } from "@/lib/rate-limit/daily-rate-limiter";
import {
  analyzeErrorResponseSchema,
  analyzeRequestSchema,
} from "@/lib/analysis/schemas";

function errorResponse(
  code: string,
  message: string,
  status: number,
  headers?: HeadersInit,
): Response {
  return Response.json(
    analyzeErrorResponseSchema.parse({ error: { code, message } }),
    {
      status,
      headers,
    },
  );
}

export const runtime = "nodejs";

const coordinator = new AnalyzeRequestCoordinator();

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(
      "INVALID_INPUT",
      "JSON 형식의 요청 본문이 필요합니다.",
      400,
    );
  }

  const input = analyzeRequestSchema.safeParse(body);

  if (!input.success) {
    return errorResponse(
      "INVALID_INPUT",
      "질문은 2자 이상 300자 이하로 입력해 주세요.",
      400,
    );
  }

  try {
    const result = await coordinator.execute(
      input.data,
      getDemoClientIdentity(request),
    );

    return Response.json(result);
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return errorResponse(
        "RATE_LIMITED",
        "오늘의 데모 분석 한도에 도달했습니다. 내일 다시 시도해 주세요.",
        429,
        { "Retry-After": String(error.retryAfterSeconds) },
      );
    }

    if (error instanceof AnalyzeQuestionServiceError) {
      const status =
        error.code === "UNSUPPORTED_QUESTION"
          ? 422
          : error.code === "DATA_UNAVAILABLE"
            ? 503
            : 502;

      return errorResponse(error.code, error.message, status);
    }

    return errorResponse(
      "INTERNAL_ERROR",
      "분석 결과를 구성하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      500,
    );
  }
}
