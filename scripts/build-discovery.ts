import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { VENDORS } from "../src/lib/constants";
import type { Model } from "../src/lib/schema";
import { releaseDate, gapBetween, formatGap, todayISO } from "../src/lib/intervals";
import { siteUrl, escapeHtml as e } from "./site-config";

type Layout = (title: string, description: string, canonical: string, body: string) => string;
export const vendorName = (id: string) => ({ meta: "Meta / Llama", deepseek: "DeepSeek", xai: "xAI / Grok", mistral: "Mistral", cohere: "Cohere", amazon: "Amazon / Nova", microsoft: "Microsoft / Phi", ibm: "IBM / Granite", nvidia: "NVIDIA / Nemotron", minimax: "MiniMax", ai21: "AI21 / Jamba", allenai: "Ai2 / OLMo", tii: "TII / Falcon", liquid: "Liquid AI", qwen: "Qwen / 通义千问", zhipu: "Z.ai / 智谱", bytedance: "Seed / 字节豆包", baidu: "ERNIE / 文心", tencent: "Hunyuan / 腾讯混元", moonshot: "Kimi / 月之暗面", anthropic: "Anthropic / Claude", openai: "OpenAI / GPT", google: "Google / Gemini", stepfun: "阶跃星辰", iflytek: "讯飞星火", "01ai": "零一万物", internlm: "书生浦语", baichuan: "百川智能" } as Record<string, string>)[id] || id;
export const modelLink = (m: Model) => `<a href="./${m.id}.html">${e(m.name)}</a>`;
const source = (m: Model) => `<a href="${e(m.sources[0])}" target="_blank" rel="noopener noreferrer">来源</a>`;
const list = (models: Model[]) => `<ul class="model-list">${models.map(m => `<li data-model-id="${m.id}">${modelLink(m)} <span>${e(releaseDate(m))} · ${m.dates.ga ? "正式可用" : "仅宣布"} · ${e(vendorName(m.vendor))}</span>${m.highlights.length ? `<p>${e(m.highlights[0])}</p>` : ""}${source(m)}</li>`).join("")}</ul>`;
const descending = (models: Model[]) => models.slice().sort((a, b) => releaseDate(b).localeCompare(releaseDate(a)) || a.id.localeCompare(b.id));

export function generationTable(models: Model[]) {
  const rows: [string, (m: Model) => unknown][] = [
    ["发布（GA 优先）", releaseDate], ["上下文 / token", m => m.specs.context_window],
    ["最大输出 / token", m => m.specs.max_output], ["输入模态", m => m.specs.modalities_in.join(" / ")],
    ["输出模态", m => m.specs.modalities_out.join(" / ")],
    ["输入发布价 / 百万 token / USD", m => m.specs.pricing.input_per_mtok],
    ["输出发布价 / 百万 token / USD", m => m.specs.pricing.output_per_mtok],
    ["开放权重", m => m.open_weights ? "是" : "否"],
  ];
  return `<div class="table-scroll" tabindex="0" aria-label="代际规格对比"><table><thead><tr><th>规格</th>${models.map(m => `<th>${modelLink(m)}</th>`).join("")}</tr></thead><tbody>${rows.map(([label, get]) => `<tr><th scope="row">${label}</th>${models.map(m => `<td>${e(get(m) ?? "未核实")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

export function buildDiscovery(models: Model[], out: string, layout: Layout) {
  const base = siteUrl(), today = todayISO();
  const urls: { url: string; date: string }[] = [];
  const latest = models.map(m => m.verified_at).filter(d => d.length === 10).sort().at(-1) || "";
  const write = (slug: string, title: string, description: string, body: string, date = latest) => {
    const url = `${base}model/${slug}.html`;
    writeFileSync(join(out, `${slug}.html`), layout(`${title}｜模型编年史`, description, url, `<p class="eyebrow">MODEL CHRONICLE / EXPLORE</p><h1>${e(title)}</h1><p class="lead">${e(description)}</p>${body}`));
    urls.push({ url, date });
  };
  const vendors = VENDORS.filter(v => models.some(m => m.vendor === v));
  for (const vendor of vendors) {
    const items = descending(models.filter(m => m.vendor === vendor));
    const families = [...new Set(items.map(m => m.family))];
    write(`vendor-${vendor}`, `${vendorName(vendor)} 模型发布时间线`, `已收录 ${items.length} 个型号，按正式可用或宣布日期排列。每条记录可追溯到来源，收录不代表厂商全部产品。`, `<nav class="actions">${families.map(f => `<a href="./family-${vendor}-${f}.html">${e(f)} 系列</a>`).join("")}</nav>${list(items)}`);
    for (const family of families) {
      const familyModels = items.filter(m => m.family === family);
      write(`family-${vendor}-${family}`, `${vendorName(vendor)} · ${family} 系列演进`, `查看 ${familyModels.length} 个已收录型号的发布时间、关键变化和已有继任关系。不同档位不自动视为前后代。`, `<p><a href="./vendor-${vendor}.html">返回厂商全部型号</a></p>${list(familyModels)}<section><h2>已记录的继任关系</h2><ul>${familyModels.filter(m => m.predecessor).map(m => { const previous = models.find(p => p.id === m.predecessor)!; return `<li>${modelLink(previous)} → ${modelLink(m)} · ${formatGap(gapBetween(releaseDate(previous), releaseDate(m)))}</li>`; }).join("") || "<li>尚无已核实的继任关系。</li>"}</ul></section>`);
    }
  }
  const pairs = descending(models).filter(m => m.predecessor && m.highlights.length && m.specs.context_window != null && models.find(p => p.id === m.predecessor)?.specs.context_window != null);
  const selected: Model[] = [];
  for (const m of pairs) if (!selected.some(p => p.vendor === m.vendor) && selected.length < 6) selected.push(m);
  for (const m of selected) {
    const previous = models.find(p => p.id === m.predecessor)!;
    write(`compare-${previous.id}-vs-${m.id}`, `${previous.name} 与 ${m.name}：代际变化`, `两代发布间隔 ${formatGap(gapBetween(releaseDate(previous), releaseDate(m)))}。对照已核实规格与发布价，不依据不同条件的基准判断胜负。`, `${generationTable([previous, m])}<section><h2>${e(m.name)} 的关键变化</h2><ul>${m.highlights.map(h => `<li>${e(h)}</li>`).join("")}</ul></section><section><h2>来源与进一步比较</h2><p>${modelLink(previous)} · ${source(previous)} / ${modelLink(m)} · ${source(m)}</p><a href="../#/compare?cmp=${previous.id},${m.id}">在交互对比中打开</a></section>`);
  }
  write("comparisons", "精选代际对比", "优先选择有前代关系、上下文资料和关键变化说明的型号。发布价格不是当前报价。", `<ul>${selected.map(m => { const p = models.find(p => p.id === m.predecessor)!; return `<li><a href="./compare-${p.id}-vs-${m.id}.html">${e(p.name)} → ${e(m.name)}</a></li>`; }).join("")}</ul><p><a href="../#/compare">自行选择最多四个型号对比</a></p>`);
  const cutoff = new Date(Date.parse(today) - 29 * 864e5).toISOString().slice(0, 10);
  const recent = descending(models).filter(m => releaseDate(m).length === 10 && releaseDate(m) >= cutoff && releaseDate(m) <= today);
  const monthOnly = descending(models).filter(m => releaseDate(m).length === 7 && releaseDate(m) >= cutoff.slice(0, 7) && releaseDate(m) <= today.slice(0, 7));
  write("recent", "最近 30 天发布与更新订阅", `发布窗口 ${cutoff} 至 ${today}。按模型发布日期统计，不将最近补录或复核当作新发布。`, `<p class="actions"><a href="../releases.xml">订阅发布 RSS</a><a href="../updates.xml">订阅记录复核 RSS</a></p>${recent.length ? list(recent) : "<p>此窗口尚无已收录的精确日期发布。</p>"}${monthOnly.length ? `<section><h2>仅知月份，可能与窗口重叠</h2>${list(monthOnly)}</section>` : ""}<section><h2>近期复核的记录</h2><p>以下是核对日期，不是首次收录时间，也不表示每个字段发生了变化。</p><ul>${models.slice().sort((a, b) => b.verified_at.localeCompare(a.verified_at) || a.id.localeCompare(b.id)).slice(0, 20).map(m => `<li>${modelLink(m)} · 复核 ${e(m.verified_at)}</li>`).join("")}</ul></section>`, today);
  const lifecycle = models.filter(m => m.dates.retired || m.dates.deprecated).sort((a, b) => (a.dates.retired || a.dates.deprecated!).localeCompare(b.dates.retired || b.dates.deprecated!));
  write("lifecycle", "模型弃用、下线与迁移资料", `截至 ${today} 的已收录官方生命周期日期。未填写日期不表示仍在服务；历史继任关系不等于官方迁移建议。`, `<p>日期来自各型号资料页的来源。涉及迁移时请查看厂商公告确认推荐型号与兼容性；本站不自动把历史后继认定为迁移目标。</p><ul class="model-list">${lifecycle.map(m => { const next = models.filter(p => p.predecessor === m.id); const r = m.dates.retired; const days = r?.length === 10 ? Math.ceil((Date.parse(r) - Date.parse(today)) / 864e5) : null; return `<li>${modelLink(m)}<span>弃用公告 ${e(m.dates.deprecated || "未核实")} · 下线 ${e(r || "未核实")}${days !== null ? days > 0 ? ` · 距下线 ${days} 天` : " · 已到下线日期" : ""}</span><p>历史后继：${next.map(modelLink).join("、") || "尚无记录"}；官方迁移建议请查阅型号来源。</p></li>`; }).join("")}</ul>`, today);
  write("million-context", "哪些已收录模型支持百万 token 上下文？", "筛选已核实的上下文窗口 ≥ 1,000,000 token 的型号。窗口上限不代表任意输入长度下都有同样的质量、输出长度或价格。", list(descending(models.filter(m => (m.specs.context_window ?? 0) >= 1e6))));
  write("methodology", "如何读懂发布日期、价格与模型对比", "理解本站日期口径、发布价格、同条件评测和缺失值，再使用时间轴与分析图。", `<section><h2>宣布与正式可用有什么区别？</h2><p>宣布是厂商披露型号的时间；正式可用是记录来源确认 API 或产品向公众开放的时间。本站时间轴优先使用正式可用日期，缺失时明确标为仅宣布。月份精度不补造具体日期。</p></section><section><h2>弃用与下线有什么区别？</h2><p>弃用公告不等于立即停服；下线日期是来源记载的服务结束时间。权重已经发布的模型仍可能自托管。未记录生命周期的型号显示状态未核实。</p></section><section><h2>为什么发布价不是当前价格？</h2><p>发布价保留型号发布时的标准文本 API 价格；历史观测保存当时来源及日期。缓存、长上下文、地区、批处理和快照不同可能影响计费。最后一次观测不保证今天仍适用。</p><a href="./calculator.html">按已记录价格试算</a></section><section><h2>为什么有分数却不能排名？</h2><p>基准版本、工具、推理强度和评测框架可能不同。只有这些条件完整且一致的同组记录用于排名。未收录分数不代表能力为零；没有开放权重对照样本也不代表它们落后。</p></section><section><h2>开放权重是否等于可自由商用？</h2><p>不是。本站开放权重字段只描述权重可获取性，实际许可和使用条件应查看官方模型卡。本站 CC BY 4.0 许可只适用于整理的数据记录。</p></section><p>这些是本站整理口径。具体型号的事实依据、核对日期和原始链接均在其<a href="./">独立资料页</a>。</p>`);
  const labels = Object.fromEntries(vendors.map(v => [v, vendorName(v)]));
  const setup = `<script type="application/json" id="catalog-labels">${JSON.stringify(labels).replaceAll("<", "\\u003c")}</script>`;
  write("finder", "按需求找模型", "按厂商、输入模态、上下文、开放权重和发布时间缩小范围。未知字段不会被当作满足条件；结果不构成性能排名。", `${setup}<form id="finder" class="form-grid"><label>型号或厂商<input name="q" type="search" placeholder="例如 gpt 4o、千问"></label><label>厂商<select name="vendor"><option value="">全部</option>${vendors.map(v => `<option value="${v}">${e(vendorName(v))}</option>`).join("")}</select></label><label>输入模态<select name="modality"><option value="">不限</option><option value="image">图像</option><option value="audio">音频</option><option value="video">视频</option><option value="text">文本</option></select></label><label>最低上下文 / token<input name="context" type="number" min="0" step="1" placeholder="例如 200000"></label><label>发布开始<input name="from" type="date"></label><label>发布结束<input name="to" type="date"></label><label><input name="open" type="checkbox">仅开放权重</label><div class="actions"><button type="reset">清空筛选</button><button type="button" id="export-selection" disabled>导出结果 CSV</button></div></form><p id="finder-status" role="status">正在准备筛选；完整目录可在下方直接浏览。</p><div id="finder-results">${list(descending(models))}</div><noscript><p>交互筛选需要 JavaScript；上方完整目录和厂商页仍可浏览。</p></noscript>`);
  write("calculator", "模型 API 用量费用试算", "选择发布价格或有来源的历史观测，按输入、输出 token 与请求次数计算美元费用。此结果不是当前报价。", `${setup}<form id="calculator" class="form-grid"><label>模型<select name="model" disabled><option>正在加载可试算模型</option></select></label><label>价格依据<select name="price" disabled></select></label><label>每次输入 token<input name="input" type="number" min="0" step="1" value="3000" required></label><label>每次输出 token<input name="output" type="number" min="0" step="1" value="1000" required></label><label>请求次数<input name="requests" type="number" min="0" step="1" value="1000" required></label></form><section><h2>试算结果</h2><output id="estimate" aria-live="polite">正在加载价格资料…</output><p id="price-basis"></p><p class="muted">公式：（每次输入 × 输入单价 + 每次输出 × 输出单价）× 请求次数 ÷ 1,000,000。未包含缓存、批处理、阶梯定价、长上下文附加费、税费或汇率。</p></section><noscript><p>费用试算需要 JavaScript；可在<a href="./">模型页</a>查阅发布价与历史观测。</p></noscript>`);
  write("explore", "模型资料与工具", "从具体问题出发，查看系列演进、代际差异、发布动态与有来源的数据。", `<div class="cards">${[["finder","按需求找模型","按规格筛选并导出"],["comparisons","精选代际对比","了解两代之间的变化"],["calculator","用量费用试算","指定用量与价格依据"],["recent","近期发布与 RSS","区分发布与记录复核"],["lifecycle","弃用与下线","查看日期与型号来源"],["million-context","百万上下文模型","只列已核实窗口"],["methodology","如何理解这些数据","日期、价格、评测与许可"]].map(([id,title,sub]) => `<a class="card" href="./${id}.html"><strong>${title}</strong><span>${sub}</span></a>`).join("")}</div><section><h2>按厂商浏览</h2><ul class="index">${vendors.map(v => `<li><a href="./vendor-${v}.html">${e(vendorName(v))}</a></li>`).join("")}</ul></section>`);
  const rss = (updates: boolean) => {
    const dated = models.filter(m => (updates ? m.verified_at : releaseDate(m)).length === 10 && (updates ? m.verified_at : releaseDate(m)) <= today).sort((a, b) => (updates ? b.verified_at : releaseDate(b)).localeCompare(updates ? a.verified_at : releaseDate(a)) || a.id.localeCompare(b.id)).slice(0, 40);
    const title = updates ? "模型记录复核" : "模型发布";
    return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${title} · 模型编年史</title><link>${base}model/recent.html</link><description>${updates ? "核对日期不表示首次收录或字段发生变化" : "按已核实发布日期，不按补录时间"}</description><language>zh-cn</language>${dated.map(m => { const date = updates ? m.verified_at : releaseDate(m); return `<item><title>${e(m.name)} · ${updates ? "记录复核" : m.dates.ga ? "正式可用" : "宣布"}</title><link>${base}model/${m.id}.html</link><guid isPermaLink="false">${base}${updates ? "review" : "release"}/${m.id}/${date}</guid><pubDate>${new Date(`${date}T00:00:00Z`).toUTCString()}</pubDate><description>${e(`${date}。${m.highlights.join("；") || "查看型号规格与来源。"}`)}</description></item>`; }).join("")}</channel></rss>`;
  };
  writeFileSync(join(out, "../releases.xml"), rss(false));
  writeFileSync(join(out, "../updates.xml"), rss(true));
  return urls;
}
