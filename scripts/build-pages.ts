import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import type { Model } from "../src/lib/schema";
import { VENDORS } from "../src/lib/constants";
import { siteUrl, escapeHtml as escape, socialMeta, repositoryUrl } from "./site-config";

import { buildDiscovery, generationTable, modelLink, vendorName } from "./build-discovery";
import { releaseDate, gapBetween, formatGap } from "../src/lib/intervals";

const root = join(import.meta.dirname, "..");
const models = JSON.parse(readFileSync(join(root, "src/generated/models.json"), "utf8")) as Model[];
const out = join(root, "public/model");
const base = siteUrl();
const assetVersion = createHash("sha256").update(readFileSync(join(root, "public/graph-v2/catalog-tools.js"))).update(readFileSync(join(root, "public/graph-v2/catalog-page.js"))).digest("hex").slice(0, 12);
const show = (value: unknown) => value === null || value === undefined ? "未核实" : escape(value);
const fact = (label: string, value: unknown) => `<div class="fact"><dt>${escape(label)}</dt><dd>${show(value)}</dd></div>`;
const sourceLink = (url: string, label = url) => `<a href="${escape(url)}" rel="noopener noreferrer" target="_blank">${escape(label)}</a>`;

function layout(title: string, description: string, canonical: string, body: string) {
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(title)}</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="${escape(canonical)}">${socialMeta(title, description, canonical)}<link rel="stylesheet" href="./site.css"><link rel="alternate" type="application/rss+xml" title="模型发布" href="../releases.xml"><link rel="alternate" type="application/rss+xml" title="记录复核" href="../updates.xml"><script defer src="../graph-v2/catalog-tools.js?v=${assetVersion}"></script><script defer src="../graph-v2/catalog-page.js?v=${assetVersion}" data-dataset="../dataset/models.json"></script></head>
<body><header><a class="brand" href="../">▦ <span>model-chronicle</span></a><nav><a href="./explore.html">资料与工具</a><a href="./">模型索引</a><a href="../">交互时间轴</a></nav></header><main>${body}</main><footer>模型编年史 · 只展示已有来源的数据；未核实不等于零。 <a href="../dataset/models.csv">下载 CSV</a> · <a href="../dataset/LICENSE.md">数据许可</a></footer></body></html>`;
}

function page(model: Model) {
  const url = `${base}model/${model.id}.html`;
  const published = model.dates.ga ?? model.dates.announced;
  const description = `${model.name}：${model.dates.ga ? "正式可用" : "仅有宣布日期"} ${published}。${model.specs.context_window != null ? `上下文 ${model.specs.context_window.toLocaleString("en-US")} token。` : ""}${model.highlights[0] || "查看已核实的规格、发布价、基准与来源。"}`;
  const price = model.specs.pricing.input_per_mtok !== null && model.specs.pricing.output_per_mtok !== null
    ? `$${model.specs.pricing.input_per_mtok} 输入 / $${model.specs.pricing.output_per_mtok} 输出，美元 / 百万文本 token`
    : null;
  const facts = [
    fact("厂商", model.vendor), fact("产品线 / 档位", `${model.family} / ${model.tier}`),
    fact("宣布", model.dates.announced), fact("正式可用", model.dates.ga),
    fact("API 弃用公告", model.dates.deprecated), fact("API 下线", model.dates.retired),
    fact("输入模态", model.specs.modalities_in.join(" / ") || null),
    fact("输出模态", model.specs.modalities_out.join(" / ") || null),
    fact("知识截止", model.specs.knowledge_cutoff),
    fact("开放权重", model.open_weights ? "是" : "否"),
    fact("上下文窗口", model.specs.context_window === null ? null : `${model.specs.context_window.toLocaleString()} token`),
    fact("最大输出", model.specs.max_output === null ? null : `${model.specs.max_output.toLocaleString()} token`),
    fact("参数量", model.specs.params_b === null ? null : `${model.specs.params_b}B`),
    fact("发布时标准 API 价格", price),
  ].join("");
  const architecture = model.arch
    ? `<section><h2>架构资料</h2><p>${sourceLink(model.arch.source, "架构来源")}</p><dl class="facts">${Object.entries(model.arch).filter(([key]) => key !== "source").map(([key, value]) => fact(key, value)).join("")}</dl></section>`
    : "";
  const benchmarks = model.benchmarks.length
    ? `<section><h2>基准观测</h2><p class="muted">分数的测试条件可能不同；只有完整核实的同条件对照组才能比较。</p><ul>${model.benchmarks.map((b) => `<li><strong>${escape(b.name)}：${escape(b.score)}</strong><span>${sourceLink(b.source, "来源")}${b.comparison_group ? ` · 同条件组：${escape(b.comparison_group)}` : " · 尚未归入同条件组"}</span></li>`).join("")}</ul></section>`
    : "";
  const prices = model.price_history?.length
    ? `<section><h2>有来源的价格观测</h2><p class="muted">观测日期不等于价格生效日；最后一条也不代表今天仍按该价格计费。</p><ul>${model.price_history.map((p) => `<li><strong>${escape(p.observed_at)} · 输入 $${escape(p.input_per_mtok)} / 输出 $${escape(p.output_per_mtok)}</strong><span>${sourceLink(p.source, "来源")}${p.note ? ` · ${escape(p.note)}` : ""}</span></li>`).join("")}</ul></section>`
    : "";
  const sources = `<section><h2>记录来源</h2><ul>${model.sources.map((url) => `<li>${sourceLink(url)}</li>`).join("")}</ul></section>`;
  const previous = models.find(m => m.id === model.predecessor);
  const next = models.filter(m => m.predecessor === model.id);
  const siblings = models.filter(m => m.vendor === model.vendor && m.family === model.family && m.generation === model.generation && m.id !== model.id);
  const highlights = model.highlights.length ? `<section><h2>这一代的关键变化</h2><ul>${model.highlights.map(h => `<li>${escape(h)}</li>`).join("")}</ul></section>` : "";
  const changes = previous ? `<section><h2>与 ${escape(previous.name)} 相比</h2><p>发布间隔 ${formatGap(gapBetween(releaseDate(previous), releaseDate(model)))}；日期按 GA 优先。规格变化不直接代表性能提升。</p>${generationTable([previous, model])}<p><a href="../#/compare?cmp=${previous.id},${model.id}">打开交互对比</a></p></section>` : "";
  const related = `<section><h2>版本关系与同系列型号</h2><p>前代：${previous ? modelLink(previous) : "尚无记录"}</p><p>后继：${next.map(modelLink).join("、") || "尚无记录"}</p>${siblings.length ? `<p>同版本其他型号：${siblings.map(modelLink).join("、")}</p>` : ""}<p><a href="./family-${model.vendor}-${model.family}.html">查看系列演进</a> · <a href="./vendor-${model.vendor}.html">${escape(vendorName(model.vendor))} 全部收录</a></p><p class="muted">历史后继不等于官方迁移建议。迁移前请核对厂商公告。</p></section>`;
  const citation = `${model.name} — 模型编年史。记录核对：${model.verified_at}。${url}\n来源：${model.sources.join("\n")}\n数据许可：CC BY 4.0；整理：Model Chronicle（majiayu000）。`;
  const issue = new URL(`${repositoryUrl}/issues/new`);
  issue.searchParams.set("title", `数据纠错：${model.name}`);
  issue.searchParams.set("body", `型号：${model.id}\n页面：${url}\n\n需要修正的字段：\n建议值：\n官方依据链接与说明：\n`);
  const actions = `<section><h2>引用或纠正这条记录</h2><p class="actions"><button type="button" data-copy-citation>复制引用</button><a href="${escape(issue.href)}" target="_blank" rel="noopener noreferrer">报告数据问题</a><a href="./calculator.html?model=${model.id}">费用试算</a></p><textarea readonly aria-label="可复制的引用" id="citation">${escape(citation)}</textarea><p role="status" id="copy-status"></p></section>`;
  const breadcrumb = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "模型资料", item: `${base}model/explore.html` }, { "@type": "ListItem", position: 2, name: vendorName(model.vendor), item: `${base}model/vendor-${model.vendor}.html` }, { "@type": "ListItem", position: 3, name: model.name, item: url }] };
  const body = `<nav aria-label="面包屑"><a href="./explore.html">模型资料</a> / <a href="./vendor-${model.vendor}.html">${escape(vendorName(model.vendor))}</a> / ${escape(model.name)}</nav><h1>${escape(model.name)}</h1><p class="lead">${escape(description)}</p><p><a class="action" href="../#/detail/${model.id}">在交互图中打开 ↗</a></p>${highlights}<dl class="facts">${facts}</dl>${changes}${related}${architecture}${benchmarks}${prices}${sources}<p class="muted">本条记录最近核对：${escape(model.verified_at)}。可访问的来源链接不代表其中每个字段已再次核实。</p>${actions}<script type="application/ld+json">${JSON.stringify(breadcrumb).replaceAll("<", "\\u003c")}</script>`;
  writeFileSync(join(out, `${model.id}.html`), layout(`${model.name} 发布时间、规格与发布价格｜模型编年史`, description, url, body));
}

rmSync(out, { recursive: true, force: true }); // This directory contains generated pages only.
mkdirSync(out, { recursive: true });
for (const model of models) page(model);
const groups = VENDORS.map((vendor) => ({ vendor, models: models.filter((m) => m.vendor === vendor).sort((a, b) => a.name.localeCompare(b.name)) })).filter((g) => g.models.length);
const list = groups.map((g) => `<section><h2>${escape(g.vendor)} <small>${g.models.length}</small></h2><ul class="index">${g.models.map((m) => `<li><a href="./${m.id}.html">${escape(m.name)}</a><span>${m.dates.ga ? "正式可用" : "仅宣布"} ${escape(m.dates.ga ?? m.dates.announced)}</span></li>`).join("")}</ul></section>`).join("");
writeFileSync(join(out, "index.html"), layout("模型索引 | 模型编年史", `浏览 ${models.length} 个已收录模型的独立资料页与来源。`, `${base}model/`, `<p class="eyebrow">DATA INDEX / ${models.length} MODELS</p><h1>模型索引</h1><p class="lead">每个页面都保留宣布与正式可用日期、发布时价格和来源。缺失资料保持未核实。</p>${list}`));
writeFileSync(join(out, "site.css"), `*{box-sizing:border-box}body{margin:0;background:#0e0f11;color:#ecebe6;font:15px/1.7 -apple-system,BlinkMacSystemFont,"Noto Sans SC",sans-serif}a{color:#d4f53c}a:hover{color:#e9ff92}:focus-visible{outline:2px solid #d4f53c;outline-offset:3px}header,footer{padding:16px max(24px,calc((100vw - 1120px)/2));background:#141518;border-bottom:1px solid #26282d}header{display:flex;justify-content:space-between;gap:20px;align-items:center}header a{text-decoration:none}header nav{display:flex;gap:18px;font-size:13px}.brand{color:#ecebe6;font:600 14px ui-monospace,monospace}.brand:first-letter{color:#d4f53c}main{max-width:1120px;margin:auto;padding:56px 24px 96px}.eyebrow{color:#858892;text-transform:uppercase;font:12px ui-monospace,monospace}h1{font-size:clamp(36px,6vw,64px);line-height:1.08;margin:12px 0 20px}h2{font-size:20px;margin:0 0 12px}.lead{font-size:17px;color:#b9bbc1;max-width:760px}.action{display:inline-block;padding:8px 14px;border:1px solid #d4f53c;border-radius:6px;text-decoration:none}.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1px;background:#26282d;border:1px solid #26282d;border-radius:10px;overflow:hidden;margin:38px 0 28px}.fact{background:#141518;padding:14px 16px}dt{font-size:12px;color:#9a9ca3}dd{margin:4px 0 0;font:500 15px ui-monospace,monospace}section{background:#141518;border:1px solid #26282d;border-radius:10px;padding:20px;margin-top:16px}section ul{padding-left:20px;margin:12px 0 0}section li{padding:8px 0;overflow-wrap:anywhere}section li span{display:block;color:#9a9ca3;font-size:12px}.muted{color:#9a9ca3;font-size:13px}.actions{display:flex;gap:12px;flex-wrap:wrap;align-items:center}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px}.card{display:flex;flex-direction:column;padding:22px;border:1px solid #33363c;border-radius:10px;background:#141518;text-decoration:none}.card span{color:#9a9ca3;font-size:13px;margin-top:8px}.form-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px;background:#141518;padding:22px;border:1px solid #33363c;border-radius:10px}.form-grid label{display:flex;flex-direction:column;gap:6px;font-size:13px}input,select,button,textarea{font:inherit;color:#ecebe6;background:#1b1c20;border:1px solid #555;border-radius:5px;padding:9px;max-width:100%}input[type=checkbox]{align-self:flex-start}button{cursor:pointer}button:disabled{opacity:.5;cursor:wait}textarea{width:100%;min-height:140px}.table-scroll{overflow:auto}table{border-collapse:collapse;width:100%;min-width:520px}th,td{padding:12px;border-bottom:1px solid #33363c;text-align:left}th{background:#141518}th:first-child{position:sticky;left:0;min-width:140px}.model-list{list-style:none;padding:0}.model-list li{padding:16px 0;border-bottom:1px solid #33363c}.model-list span{display:block;color:#9a9ca3;font-size:13px}.model-list p{margin:5px 0}output{font-size:32px;color:#d4f53c}header nav{flex-wrap:wrap}.index{columns:2;column-gap:32px}.index li{break-inside:avoid}.index li span{display:inline;margin-left:12px}small{font:12px ui-monospace,monospace;color:#858892}footer{border-top:1px solid #26282d;border-bottom:0;color:#9a9ca3;font-size:12px}@media(max-width:650px){header{padding:12px 16px;flex-wrap:wrap}main{padding:32px 16px 64px}.index{columns:1}}`);
// Partial verification dates cannot be expanded into an invented calendar day.
const lastmod = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) ? `<lastmod>${date}</lastmod>` : "";
const latest = models.map(m => m.verified_at).filter(d => d.length === 10).sort().at(-1) ?? "";
const discoveryUrls = buildDiscovery(models, out, layout);
const urls = [...discoveryUrls, { url: base, date: latest }, { url: `${base}model/`, date: latest }, ...models.map(m => ({ url: `${base}model/${m.id}.html`, date: m.verified_at }))];
writeFileSync(join(root, "public/sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(({ url, date }) => `  <url><loc>${escape(url)}</loc>${lastmod(date)}</url>`).join("\n")}\n</urlset>\n`);
writeFileSync(join(root, "public/robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${base}sitemap.xml\n`);
console.log(`已生成 ${models.length} 个独立模型页面、模型索引和 sitemap.xml`);
