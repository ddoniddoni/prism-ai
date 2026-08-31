import type { AIProvider } from "./provider";
import { MockAIProvider } from "./mock-provider";

export function createAIProvider(): AIProvider {
  return new MockAIProvider();
}
