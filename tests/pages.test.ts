import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..");
const data = JSON.parse(readFileSync(join(root, "src/generated/models.json"), "utf8")) as { id: string }[];
const modelDir = join(root, "public/model");

describe("static model pages", () => {
  it("generates one crawlable HTML page and index link for each validated model", () => {
    const index = readFileSync(join(modelDir, "index.html"), "utf8");
    const sitemap = readFileSync(join(root, "public/sitemap.xml"), "utf8");
    expect((index.match(/href="\.\/[a-z0-9-]+\.html"/g) ?? []).length).toBe(data.length);
    expect((sitemap.match(/<loc>https:\/\/majiayu000\.github\.io\/model-chronicle\/model\/[a-z0-9-]+\.html<\/loc>/g) ?? []).length).toBe(data.length);
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
    expect(priced).toContain("<link rel=\"canonical\" href=\"https://majiayu000.github.io/model-chronicle/model/gpt-4o.html\"");
  });
});
