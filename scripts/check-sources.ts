import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Model } from "../src/lib/schema";
import { checkSource } from "../src/lib/source-check";

const root = join(import.meta.dirname, "..");
const models = JSON.parse(readFileSync(join(root, "src/generated/models.json"), "utf8")) as Model[];
const byUrl = new Map<string, string[]>();
for (const model of models) for (const url of model.sources) byUrl.set(url, [...(byUrl.get(url) ?? []), model.id]);
const limit = Number(process.argv.find((arg) => arg.startsWith("--limit="))?.split("=")[1] ?? Infinity);
const entries = [...byUrl].slice(0, Number.isFinite(limit) ? limit : undefined);
const results: { url: string; model_ids: string[]; status: number | null; result: string }[] = [];
let next = 0;

async function worker() {
  while (next < entries.length) {
    const [url, model_ids] = entries[next++];
    const { status, result } = await checkSource(url);
    results.push({ url, model_ids, status, result });
  }
}

await Promise.all(Array.from({ length: Math.min(8, entries.length) }, () => worker()));
results.sort((a, b) => a.url.localeCompare(b.url));
const report = { checked_at: new Date().toISOString(), total: results.length, reachable: results.filter((r) => r.result === "reachable").length, review_link: results.filter((r) => r.result === "review_link").length, blocked: results.filter((r) => r.result === "blocked").length, unavailable: results.filter((r) => r.result === "unavailable").length, results };
mkdirSync(join(root, "outputs"), { recursive: true });
writeFileSync(join(root, "outputs/source-audit.json"), JSON.stringify(report, null, 2));
console.log(`来源检查 ${report.total} 条：可达 ${report.reachable}、404/410 待复核 ${report.review_link}、站点拒绝/限流 ${report.blocked}、网络不确定 ${report.unavailable}。报告：outputs/source-audit.json`);
