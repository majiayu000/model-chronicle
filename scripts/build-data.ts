import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import { parse } from "yaml";
import { validateModels } from "../src/lib/validate.ts";
import { coverage, reviewReasons } from "../src/lib/coverage.ts";

const ROOT = join(import.meta.dirname, "..");
const MODELS_DIR = join(ROOT, "data/models");
const OUT_DIR = join(ROOT, "src/generated");
const DATASET_DIR = join(ROOT, "public/dataset");

function loadRaw(): { file: string; data: unknown }[] {
  if (!existsSync(MODELS_DIR)) throw new Error(`缺少数据目录 ${MODELS_DIR}`);
  return readdirSync(MODELS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((d) =>
      readdirSync(join(MODELS_DIR, d.name))
        .filter((f) => f.endsWith(".yaml"))
        .map((f) => {
          const file = join("data/models", d.name, f);
          return { file, data: parse(readFileSync(join(ROOT, file), "utf8")) };
        }),
    );
}

const raw = loadRaw();
const { models, errors } = validateModels(raw);

// 文件名必须等于 id，目录名必须等于 vendor
for (const { file } of raw) {
  const m = models.find((x) => x.file === file);
  if (!m) continue;
  if (basename(file, ".yaml") !== m.model.id) errors.push(`${file}: 文件名与 id "${m.model.id}" 不一致`);
  if (!file.includes(`/${m.model.vendor}/`)) errors.push(`${file}: 目录与 vendor "${m.model.vendor}" 不一致`);
}

if (errors.length > 0) {
  console.error(`数据校验失败（${errors.length} 处）：`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(DATASET_DIR, { recursive: true });
const data = models.map((m) => m.model);
writeFileSync(
  join(OUT_DIR, "models.json"),
  JSON.stringify(data, null, 2),
);
writeFileSync(join(DATASET_DIR, "models.json"), JSON.stringify(data, null, 2));
const quote = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const columns = ["id", "name", "vendor", "family", "tier", "announced", "ga", "input_per_mtok", "output_per_mtok", "verified_at", "sources"];
const csv = [columns.join(","), ...data.map((m) => [m.id, m.name, m.vendor, m.family, m.tier, m.dates.announced, m.dates.ga, m.specs.pricing.input_per_mtok, m.specs.pricing.output_per_mtok, m.verified_at, m.sources.join(" | ")].map(quote).join(","))].join("\n") + "\n";
writeFileSync(join(DATASET_DIR, "models.csv"), csv);
const today = new Date().toISOString().slice(0, 10);
writeFileSync(join(DATASET_DIR, "coverage.json"), JSON.stringify(coverage(data, today), null, 2));
const reviewQueue = data.map((m) => ({ id: m.id, verified_at: m.verified_at, reasons: reviewReasons(m, today), sources: m.sources })).filter((m) => m.reasons.length);
reviewQueue.sort((a, b) => Number(b.reasons.includes("stale")) - Number(a.reasons.includes("stale")) || Number(b.reasons.includes("ga")) - Number(a.reasons.includes("ga")) || b.reasons.length - a.reasons.length || a.id.localeCompare(b.id));
writeFileSync(join(DATASET_DIR, "review-queue.json"), JSON.stringify(reviewQueue, null, 2));
console.log(`已编译 ${models.length} 个模型 → src/generated/models.json`);
