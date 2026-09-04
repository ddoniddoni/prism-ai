import { z } from "zod";

const supportedSchemaKeywords = new Set([
  "type",
  "description",
  "enum",
  "items",
  "properties",
  "required",
  "anyOf",
  "oneOf",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function convertSchemaNode(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }

  const converted: Record<string, unknown> = {};

  for (const [key, child] of Object.entries(value)) {
    if (
      key === "const" &&
      (typeof child === "string" || typeof child === "number")
    ) {
      converted.enum = [child];
      continue;
    }

    if (!supportedSchemaKeywords.has(key)) {
      continue;
    }

    if (key === "properties" && isRecord(child)) {
      converted.properties = Object.fromEntries(
        Object.entries(child).map(([property, propertySchema]) => [
          property,
          convertSchemaNode(propertySchema),
        ]),
      );
      continue;
    }

    if (key === "items") {
      converted.items = convertSchemaNode(child);
      continue;
    }

    if ((key === "anyOf" || key === "oneOf") && Array.isArray(child)) {
      converted[key] = child.map(convertSchemaNode);
      continue;
    }

    converted[key] = child;
  }

  return converted;
}

/**
 * Gemini Generate Content accepts only a subset of JSON Schema. This retains
 * the response shape and enum guidance, while Zod remains the final validator.
 */
export function createGeminiStructuredOutputSchema(schema: z.ZodType): unknown {
  return convertSchemaNode(z.toJSONSchema(schema));
}
