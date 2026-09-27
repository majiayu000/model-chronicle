import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Model } from "../src/lib/schema";
import { VENDORS } from "../src/lib/constants";

const root = join(import.meta.dirname, "..");
const models = JSON.parse(readFileSync(join(root, "src/generated/models.json"), "utf8")) as Model[];
const out = join(root, "public/model");
const base = "https://majiayu000.github.io/model-chronicle/";
const escape = (value: unknown) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const show = (value: unknown) => value === null || value === undefined ? "未核实" : escape(value);
const fact = (label: string, value: unknown) => `<div class="fact"><dt>${escape(label)}</dt><dd>${show(value)}</dd></div>`;
const sourceLink = (url: string, label = url) => `<a href="${escape(url)}" rel="noopener noreferrer" target="_blank">${escape(label)}</a>`;

function layout(title: string, description: string, canonical: string, body: string) {
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(title)}</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="${escape(canonical)}"><link rel="stylesheet" href="./site.css"></head>
<body><header><a class="brand" href="../">▦ <span>model-chronicle</span></a><nav><a href="./">模型索引</a><a href="../">交互时间轴</a></nav></header><main>${body}</main><footer>模型编年史 · 只展示已有来源的数据；未核实不等于零。 <a href="../dataset/models.csv">下载 CSV</a> · <a href="../dataset/LICENSE.md">数据许可</a></footer></body></html>`;
}

function page(model: Model) {
  const url = `${base}model/${model.id}.html`;
  const published = model.dates.ga ?? model.dates.announced;
  const description = `${model.name}：${model.dates.ga ? "正式可用" : "仅有宣布日期"} ${published}。查看已核实的规格、发布价、基准与来源。`;
  const price = model.specs.pricing.input_per_mtok !== null && model.specs.pricing.output_per_mtok !== null
    ? `$${model.specs.pricing.input_per_mtok} 输入 / $${model.specs.pricing.output_per_mtok} 输出，美元 / 百万文本 token`
    : null;
  const facts = [
    fact("厂商", model.vendor), fact("产品线 / 档位", `${model.family} / ${model.tier}`),
    fact("宣布", model.dates.announced), fact("正式可用", model.dates.ga),
    fact("上下文窗口", model.specs.context_window === null ? null : `${model.specs.context_window.toLocaleString()} token`),
    fact("最大输出", model.specs.max_output === null ? null : `${model.specs.max_output.toLocaleString()} token`),
    fact("参数量", model.specs.params_b === null ? null : `${model.specs.params_b}B`),
    fact("发布时标准 API 价格", price),
  ].join("");
  const benchmarks = model.benchmarks.length
    ? `<section><h2>基准观测</h2><p class="muted">分数的测试条件可能不同；只有完整核实的同条件对照组才能比较。</p><ul>${model.benchmarks.map((b) => `<li><strong>${escape(b.name)}：${escape(b.score)}</strong><span>${sourceLink(b.source, "来源")}${b.comparison_group ? ` · 同条件组：${escape(b.comparison_group)}` : " · 尚未归入同条件组"}</span></li>`).join("")}</ul></section>`
    : "";
  const prices = model.price_history?.length
    ? `<section><h2>有来源的价格观测</h2><p class="muted">观测日期不等于价格生效日；最后一条也不代表今天仍按该价格计费。</p><ul>${model.price_history.map((p) => `<li><strong>${escape(p.observed_at)} · 输入 $${escape(p.input_per_mtok)} / 输出 $${escape(p.output_per_mtok)}</strong><span>${sourceLink(p.source, "来源")}${p.note ? ` · ${escape(p.note)}` : ""}</span></li>`).join("")}</ul></section>`
    : "";
  const sources = `<section><h2>记录来源</h2><ul>${model.sources.map((url) => `<li>${sourceLink(url)}</li>`).join("")}</ul></section>`;
  const body = `<p class="eyebrow">${escape(model.vendor)} / ${escape(model.family)} / ${escape(model.tier)}</p><h1>${escape(model.name)}</h1><p class="lead">${escape(description)}</p><p><a class="action" href="../#/detail/${model.id}">在交互图中打开 ↗</a></p><dl class="facts">${facts}</dl>${benchmarks}${prices}${sources}<p class="muted">本条记录最近核对：${escape(model.verified_at)}。可访问的来源链接不代表其中每个字段已再次核实。</p>`;
  writeFileSync(join(out, `${model.id}.html`), layout(`${model.name} | 模型编年史`, description, url, body));
}

rmSync(out, { recursive: true, force: true }); // This directory contains generated pages only.
mkdirSync(out, { recursive: true });
for (const model of models) page(model);
const groups = VENDORS.map((vendor) => ({ vendor, models: models.filter((m) => m.vendor === vendor).sort((a, b) => a.name.localeCompare(b.name)) })).filter((g) => g.models.length);
const list = groups.map((g) => `<section><h2>${escape(g.vendor)} <small>${g.models.length}</small></h2><ul class="index">${g.models.map((m) => `<li><a href="./${m.id}.html">${escape(m.name)}</a><span>${m.dates.ga ? "正式可用" : "仅宣布"} ${escape(m.dates.ga ?? m.dates.announced)}</span></li>`).join("")}</ul></section>`).join("");
writeFileSync(join(out, "index.html"), layout("模型索引 | 模型编年史", `浏览 ${models.length} 个已收录模型的独立资料页与来源。`, `${base}model/`, `<p class="eyebrow">DATA INDEX / ${models.length} MODELS</p><h1>模型索引</h1><p class="lead">每个页面都保留宣布与正式可用日期、发布时价格和来源。缺失资料保持未核实。</p>${list}`));
writeFileSync(join(out, "site.css"), `*{box-sizing:border-box}body{margin:0;background:#0e0f11;color:#ecebe6;font:15px/1.7 -apple-system,BlinkMacSystemFont,"Noto Sans SC",sans-serif}a{color:#d4f53c}a:hover{color:#e9ff92}:focus-visible{outline:2px solid #d4f53c;outline-offset:3px}header,footer{padding:16px max(24px,calc((100vw - 1120px)/2));background:#141518;border-bottom:1px solid #26282d}header{display:flex;justify-content:space-between;gap:20px;align-items:center}header a{text-decoration:none}header nav{display:flex;gap:18px;font-size:13px}.brand{color:#ecebe6;font:600 14px ui-monospace,monospace}.brand:first-letter{color:#d4f53c}main{max-width:1120px;margin:auto;padding:56px 24px 96px}.eyebrow{color:#858892;text-transform:uppercase;font:12px ui-monospace,monospace}h1{font-size:clamp(36px,6vw,64px);line-height:1.08;margin:12px 0 20px}h2{font-size:20px;margin:0 0 12px}.lead{font-size:17px;color:#b9bbc1;max-width:760px}.action{display:inline-block;padding:8px 14px;border:1px solid #d4f53c;border-radius:6px;text-decoration:none}.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1px;background:#26282d;border:1px solid #26282d;border-radius:10px;overflow:hidden;margin:38px 0 28px}.fact{background:#141518;padding:14px 16px}dt{font-size:12px;color:#9a9ca3}dd{margin:4px 0 0;font:500 15px ui-monospace,monospace}section{background:#141518;border:1px solid #26282d;border-radius:10px;padding:20px;margin-top:16px}section ul{padding-left:20px;margin:12px 0 0}section li{padding:8px 0;overflow-wrap:anywhere}section li span{display:block;color:#9a9ca3;font-size:12px}.muted{color:#9a9ca3;font-size:13px}.index{columns:2;column-gap:32px}.index li{break-inside:avoid}.index li span{display:inline;margin-left:12px}small{font:12px ui-monospace,monospace;color:#858892}footer{border-top:1px solid #26282d;border-bottom:0;color:#9a9ca3;font-size:12px}@media(max-width:650px){header{padding:12px 16px;flex-wrap:wrap}main{padding:32px 16px 64px}.index{columns:1}}`);
const urls = [base, `${base}model/`, ...models.map((m) => `${base}model/${m.id}.html`)];
writeFileSync(join(root, "public/sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${escape(url)}</loc></url>`).join("\n")}\n</urlset>\n`);
console.log(`已生成 ${models.length} 个独立模型页面、模型索引和 sitemap.xml`);
