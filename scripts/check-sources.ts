import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Model } from "../src/lib/schema";

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
    let status: number | null = null;
    let result = "unavailable";
    try {
      let response = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(8000), redirect: "follow" });
      if (response.status === 405) response = await fetch(url, { method: "GET", signal: AbortSignal.timeout(8000), redirect: "follow" });
      status = response.status;
      result = response.ok ? "reachable" : [404, 410].includes(status) ? "review_link" : "unavailable";
      await response.body?.cancel();
    } catch { /* Timeouts and network denials require a human check. */ }
    results.push({ url, model_ids, status, result });
  }
}

await Promise.all(Array.from({ length: Math.min(8, entries.length) }, () => worker()));
results.sort((a, b) => a.url.localeCompare(b.url));
const report = { checked_at: new Date().toISOString(), total: results.length, reachable: results.filter((r) => r.result === "reachable").length, review_link: results.filter((r) => r.result === "review_link").length, unavailable: results.filter((r) => r.result === "unavailable").length, results };
mkdirSync(join(root, "outputs"), { recursive: true });
writeFileSync(join(root, "outputs/source-audit.json"), JSON.stringify(report, null, 2));
console.log(`来源检查 ${report.total} 条：可达 ${report.reachable}、需人工复核 ${report.review_link}、访问不确定 ${report.unavailable}。报告：outputs/source-audit.json`);
