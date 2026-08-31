import { describe, expect, it } from "vitest";

import { MockAIProvider } from "./mock-provider";
import { analysisPlanSchema } from "./schemas/analysis-plan";

const supportedQuestions = [
  "지난달 매출이 왜 감소했어?",
  "이번 달 성과를 보여줘.",
  "모바일만 자세히 분석해줘.",
  "작년 같은 기간과 비교해줘.",
  "가장 많이 하락한 상품은 뭐야?",
  "광고비 대비 성과를 보여줘.",
  "환불률이 높은 지역을 알려줘.",
] as const;

describe("MockAIProvider", () => {
  it("maps every supported question to schema-valid allowlisted queries", async () => {
    const provider = new MockAIProvider();

    const plans = await Promise.all(
      supportedQuestions.map((question) => provider.createPlan({ question })),
    );

    expect(plans).toHaveLength(supportedQuestions.length);
    expect(plans.every((plan) => plan.queries.length > 0)).toBe(true);
    expect(
      plans.every((plan) => analysisPlanSchema.safeParse(plan).success),
    ).toBe(true);
  });

  it("does not place business values in a planning result", async () => {
    const provider = new MockAIProvider();
    const plan = await provider.createPlan({
      question: "지난달 매출이 왜 감소했어?",
    });

    expect(JSON.stringify(plan)).not.toContain("10935");
    expect(plan.queries.every((query) => "value" in query === false)).toBe(
      true,
    );
  });
});
