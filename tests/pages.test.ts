import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { siteUrl } from "../scripts/site-config";
import type { Model } from "../src/lib/schema";

const root = join(import.meta.dirname, "..");
const data = JSON.parse(readFileSync(join(root, "src/generated/models.json"), "utf8")) as Model[];
const modelDir = join(root, "public/model");

describe("static model pages", () => {
  it("generates one crawlable HTML page and index link for each validated model", () => {
    const index = readFileSync(join(modelDir, "index.html"), "utf8");
    const sitemap = readFileSync(join(root, "public/sitemap.xml"), "utf8");
    expect((index.match(/href="\.\/[a-z0-9-]+\.html"/g) ?? []).length).toBe(data.length);
    for (const model of data) expect(sitemap).toContain(`<loc>${siteUrl()}model/${model.id}.html</loc><lastmod>${model.verified_at}</lastmod>`);
    for (const model of data) expect(existsSync(join(modelDir, `${model.id}.html`))).toBe(true);
    expect(readFileSync(join(root, "public/dataset/LICENSE.md"), "utf8")).toContain("CC BY 4.0");
  });

  it("distinguishes announced-only dates and keeps historical prices sourced", () => {
    const announced = readFileSync(join(modelDir, "claude-3-5-haiku.html"), "utf8");
    expect(announced).toContain("仅有宣布日期");
    expect(announced).toContain("正式可用</dt><dd>未核实");
    const priced = readFileSync(join(modelDir, "gpt-4o.html"), "utf8");
    expect(priced).toContain("2024-10-01");
    expect(priced).toContain("https://openai.com/index/api-prompt-caching/");
    expect(priced).toContain(`<link rel="canonical" href="${siteUrl()}model/gpt-4o.html"`);
  });

  it("publishes sourced specifications, lifecycle dates, architecture and social metadata", () => {
    const model = data.find(m => m.id === "gpt-4-5")!;
    const page = readFileSync(join(modelDir, `${model.id}.html`), "utf8");
    expect(page).toContain(`API 下线</dt><dd>${model.dates.retired}`);
    expect(page).toContain("输入模态</dt><dd>text / image");
    expect(page).toContain('property="og:url"');
    expect(page).toContain('name="twitter:card" content="summary"');
    const architecture = data.find(m => m.arch)!;
    expect(readFileSync(join(modelDir, `${architecture.id}.html`), "utf8")).toContain(architecture.arch!.source);
    expect(readFileSync(join(modelDir, "gpt-4o.html"), "utf8")).toContain("知识截止</dt><dd>2023-10");
    expect(readFileSync(join(root, "public/robots.txt"), "utf8")).toContain(`Sitemap: ${siteUrl()}sitemap.xml`);
  });
});
