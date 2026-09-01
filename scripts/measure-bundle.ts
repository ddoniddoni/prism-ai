import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

type AssetMeasurement = {
  gzipBytes: number;
  rawBytes: number;
};

type AssetGroup = AssetMeasurement & {
  files: readonly string[];
  label: string;
};

type RecordValue = Record<string, unknown>;

const buildDirectory = join(process.cwd(), ".next");
const dashboardManifestPath = join(
  buildDirectory,
  "server/app/dashboard/[id]/page_client-reference-manifest.js",
);
const dashboardRoute = "/dashboard/[id]/page";
const dashboardComponentPath = join(
  process.cwd(),
  "src/components/dashboard/analysis-dashboard.tsx",
);
const queryProviderPath = join(
  process.cwd(),
  "src/providers/query-provider.tsx",
);
const layoutEntryPath = join(process.cwd(), "src/app/layout");

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getRecord(value: unknown, label: string): RecordValue {
  if (!isRecord(value)) {
    throw new Error(label + " must be an object.");
  }

  return value;
}

function getStringArray(value: unknown, label: string): readonly string[] {
  if (
    !Array.isArray(value) ||
    !value.every((item) => typeof item === "string")
  ) {
    throw new Error(label + " must be a string array.");
  }

  return value;
}

function getRecordArray(value: unknown, label: string): readonly RecordValue[] {
  if (!Array.isArray(value) || !value.every(isRecord)) {
    throw new Error(label + " must be an object array.");
  }

  return value;
}

function parseJsonFile(path: string): RecordValue {
  return getRecord(JSON.parse(readFileSync(path, "utf8")) as unknown, path);
}

function parseDashboardClientManifest(): RecordValue {
  const source = readFileSync(dashboardManifestPath, "utf8");
  const assignment = 'globalThis.__RSC_MANIFEST["' + dashboardRoute + '"]=';
  const start = source.indexOf(assignment);
  const end = source.lastIndexOf(";");

  if (start === -1 || end === -1) {
    throw new Error(
      "Dashboard client reference manifest format is unsupported.",
    );
  }

  const json = source.slice(start + assignment.length, end);

  return getRecord(JSON.parse(json) as unknown, dashboardManifestPath);
}

function getStaticChunkPaths(value: unknown, label: string): readonly string[] {
  return getStringArray(value, label).filter((path) =>
    path.startsWith("static/"),
  );
}

function getModuleChunkPaths(
  clientModules: RecordValue,
  modulePath: string,
): readonly string[] {
  const moduleEntry = getRecord(clientModules[modulePath], modulePath);

  return getStaticChunkPaths(moduleEntry.chunks, modulePath + ".chunks");
}

function getCssChunkPaths(entryCssFiles: RecordValue): readonly string[] {
  const dashboardPagePath = join(process.cwd(), "src/app/dashboard/[id]/page");
  const paths = [
    ...getRecordArray(entryCssFiles[layoutEntryPath], "layout CSS files"),
    ...getRecordArray(entryCssFiles[dashboardPagePath], "dashboard CSS files"),
  ].flatMap((entry) => {
    const path = entry.path;

    return typeof path === "string" ? [path] : [];
  });

  return paths.filter((path) => path.startsWith("static/"));
}

function unique(paths: readonly string[]): readonly string[] {
  return [...new Set(paths)];
}

function getAssetFilePath(assetPath: string): string {
  return join(buildDirectory, decodeURIComponent(assetPath));
}

function measureAssets(paths: readonly string[]): AssetMeasurement {
  return paths.reduce<AssetMeasurement>(
    (total, assetPath) => {
      const filePath = getAssetFilePath(assetPath);
      const content = readFileSync(filePath);

      return {
        gzipBytes: total.gzipBytes + gzipSync(content, { level: 9 }).length,
        rawBytes: total.rawBytes + statSync(filePath).size,
      };
    },
    { gzipBytes: 0, rawBytes: 0 },
  );
}

function createAssetGroup(label: string, files: readonly string[]): AssetGroup {
  return { files, label, ...measureAssets(files) };
}

function formatBytes(value: number): string {
  return (value / 1024).toFixed(1) + " KiB";
}

function printGroup(group: AssetGroup) {
  console.log(
    group.label +
      ": " +
      formatBytes(group.rawBytes) +
      " raw / " +
      formatBytes(group.gzipBytes) +
      " gzip (" +
      group.files.length +
      " files)",
  );
}

function getLoadableFiles(
  loadableManifest: RecordValue,
  entryName: string,
): readonly string[] {
  const entry = getRecord(loadableManifest[entryName], entryName);

  return getStaticChunkPaths(entry.files, entryName + ".files");
}

function main() {
  const buildManifest = parseJsonFile(
    join(buildDirectory, "build-manifest.json"),
  );
  const loadableManifest = parseJsonFile(
    join(buildDirectory, "react-loadable-manifest.json"),
  );
  const dashboardManifest = parseDashboardClientManifest();
  const clientModules = getRecord(
    dashboardManifest.clientModules,
    "clientModules",
  );
  const entryCssFiles = getRecord(
    dashboardManifest.entryCSSFiles,
    "entryCSSFiles",
  );
  const initialFiles = unique([
    ...getStaticChunkPaths(buildManifest.polyfillFiles, "polyfillFiles"),
    ...getStaticChunkPaths(buildManifest.rootMainFiles, "rootMainFiles"),
    ...getModuleChunkPaths(clientModules, dashboardComponentPath),
    ...getModuleChunkPaths(clientModules, queryProviderPath),
    ...getCssChunkPaths(entryCssFiles),
  ]);
  const editorFiles = getLoadableFiles(
    loadableManifest,
    "components/dashboard/analysis-dashboard.tsx -> ./dashboard-editor",
  );
  const trendFiles = getLoadableFiles(
    loadableManifest,
    "components/dashboard/dashboard-renderer.tsx -> ./prism-trend-chart",
  );
  const donutFiles = getLoadableFiles(
    loadableManifest,
    "components/dashboard/dashboard-renderer.tsx -> ./prism-donut-chart",
  );
  const rankedBarFiles = getLoadableFiles(
    loadableManifest,
    "components/dashboard/dashboard-renderer.tsx -> ./prism-ranked-bar-chart",
  );

  console.log("Prism AI production bundle measurement");
  printGroup(createAssetGroup("Dashboard initial client assets", initialFiles));
  printGroup(createAssetGroup("Dashboard Editor on demand", editorFiles));
  printGroup(createAssetGroup("Trend Chart on demand", trendFiles));
  printGroup(createAssetGroup("Donut Chart on demand", donutFiles));
  printGroup(createAssetGroup("Ranked Bar Chart on demand", rankedBarFiles));
  printGroup(
    createAssetGroup(
      "All chart chunks deduplicated",
      unique([...trendFiles, ...donutFiles, ...rankedBarFiles]),
    ),
  );
}

main();
