import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { generateAnalyticsDailyRows } from "../src/lib/data/generate-local-data";

const outputPath = fileURLToPath(
  new URL("../src/data/analytics-daily.json", import.meta.url),
);

async function main() {
  const serializedRows = `${JSON.stringify(generateAnalyticsDailyRows(), null, 2)}\n`;

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, serializedRows, "utf8");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
