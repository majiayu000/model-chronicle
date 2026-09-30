import { defineConfig } from "vite";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import models from "./src/generated/models.json" with { type: "json" };
import { siteUrl, escapeHtml, socialMeta } from "./scripts/site-config.ts";

// Keep the exported runtime modules from mixing versions in a returning visitor's cache.
const runtimeHash = createHash("sha256");
for (const directory of ["./public/graph-v2/", "./public/graph-v2/vendor/"]) {
  for (const file of readdirSync(new URL(directory, import.meta.url)).filter(name => name.endsWith(".js")).sort()) {
    runtimeHash.update(file).update(readFileSync(new URL(directory + file, import.meta.url)));
  }
}
const runtimeVersion = runtimeHash.digest("hex").slice(0, 16);

export default defineConfig({
  base: "./",
  define: { __CHRONICLE_RUNTIME_VERSION__: JSON.stringify(runtimeVersion) },
  plugins: [{
    name: "site-metadata",
    transformIndexHtml(html) {
      const url = siteUrl();
      const dataset = {
        "@context": "https://schema.org", "@type": "Dataset", name: "模型编年史",
        description: "带来源的大模型发布时间、规格、发布价与基准观测数据集；缺失字段不代表零。",
        url, creator: { "@type": "Organization", name: "Model Chronicle（majiayu000）" },
        license: "https://creativecommons.org/licenses/by/4.0/",
        distribution: [
          { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${url}dataset/models.json` },
          { "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: `${url}dataset/models.csv` },
        ],
      };
      const latest = models.slice().sort((a, b) => (b.dates.ga || b.dates.announced || "").localeCompare(a.dates.ga || a.dates.announced || "")).slice(0, 5);
      const discovery = `<section id="site-discovery" aria-label="模型资料入口" style="max-width:1120px;margin:24px auto 56px;padding:24px;background:#141518;border:1px solid #33363c;border-radius:12px;color:#ecebe6;font:15px/1.7 system-ui"><h2>有来源的大模型发布时间线与规格资料</h2><p>浏览 ${models.length} 个已收录型号，比较版本变化与发布价格。缺失值表示未核实，不代表零。</p><nav style="display:flex;flex-wrap:wrap;gap:16px"><a href="./model/explore.html">资料与工具</a><a href="./model/finder.html">按需求找模型</a><a href="./model/comparisons.html">精选代际对比</a><a href="./model/calculator.html">费用试算</a><a href="./model/recent.html">近期发布与订阅</a><a href="./model/">完整模型索引</a></nav><h3>最近发布的已收录型号</h3><ul>${latest.map(m => `<li><a href="./model/${m.id}.html">${escapeHtml(m.name)}</a> · ${escapeHtml(m.dates.ga || m.dates.announced)} · ${m.dates.ga ? "正式可用" : "仅宣布"}</li>`).join("")}</ul><p>交互图加载期间或不可用时，可以直接通过以上链接查看完整静态资料。</p></section>`;
      html = html.replace("<!-- SITE_DISCOVERY -->", discovery);
      return html.replace("<!-- SITE_METADATA -->", `<style>body{margin:0;background:#0e0f11}#site-discovery a{color:#d4f53c}#site-discovery a:focus-visible{outline:2px solid #d4f53c;outline-offset:3px}@media(max-width:650px){#site-discovery{margin:16px 12px 56px!important}}</style><link rel="canonical" href="${escapeHtml(url)}"><link rel="alternate" type="application/rss+xml" title="模型发布" href="${escapeHtml(url)}releases.xml"><link rel="alternate" type="application/rss+xml" title="记录复核" href="${escapeHtml(url)}updates.xml">\n${socialMeta("模型编年史｜大模型发布时间线、规格与发布价格", dataset.description, url)}\n<script type="application/ld+json">${JSON.stringify(dataset).replaceAll("<", "\\u003c")}</script>`);
    },
  }],
});
