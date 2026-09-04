import { describe, expect, it } from "vitest";

import { analysisPlanSchema } from "./schemas/analysis-plan";
import { dashboardSpecSchema } from "./schemas/dashboard-spec";
import { createGeminiStructuredOutputSchema } from "./gemini-structured-output-schema";

describe("createGeminiStructuredOutputSchema", () => {
  it("keeps the Planner response shape while removing unsupported constraints", () => {
    const schema = createGeminiStructuredOutputSchema(analysisPlanSchema);
    const serialized = JSON.stringify(schema);

    expect(serialized).toContain('"queries"');
    expect(serialized).toContain('"unitsSold"');
    expect(serialized).not.toContain('"$schema"');
    expect(serialized).not.toContain('"minLength"');
    expect(serialized).not.toContain('"maxLength"');
    expect(serialized).not.toContain('"pattern"');
  });

  it("preserves dashboard widget alternatives and literal type guidance", () => {
    const schema = createGeminiStructuredOutputSchema(
      dashboardSpecSchema.omit({ id: true, context: true }),
    );
    const serialized = JSON.stringify(schema);

    expect(serialized).toContain('"oneOf"');
    expect(serialized).toContain('"calendarHeatmap"');
    expect(serialized).not.toContain('"const"');
  });
});
