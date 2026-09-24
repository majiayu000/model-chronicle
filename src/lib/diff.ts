import type { Model } from "./schema";

export interface SpecRow {
  label: string;
  value: string;
  /** 相对前代的变化描述；无前代或任一侧缺数据时为 null */
  delta: string | null;
  better: boolean | null;
}

const fmtTokens = (n: number) => (n >= 1_000_000 ? `${n / 1_000_000}M` : `${Math.round(n / 1000)}K`);
const fmtPrice = (n: number) => `$${n}`;

function numRow(
  label: string,
  cur: number | null,
  prev: number | null | undefined,
  fmt: (n: number) => string,
  higherIsBetter: boolean,
): SpecRow {
  const value = cur === null ? "未公开" : fmt(cur);
  if (cur === null || prev === null || prev === undefined || prev === 0) {
    return { label, value, delta: null, better: null };
  }
  if (cur === prev) return { label, value, delta: "持平", better: null };
  const ratio = cur / prev;
  const delta = ratio >= 2 || ratio <= 0.5 ? `×${ratio.toFixed(ratio < 1 ? 2 : 1)}` : `${ratio > 1 ? "+" : ""}${Math.round((ratio - 1) * 100)}%`;
  return { label, value, delta, better: higherIsBetter ? ratio > 1 : ratio < 1 };
}

export function specRows(m: Model, prev: Model | null): SpecRow[] {
  const p = prev?.specs;
  return [
    numRow("上下文窗口", m.specs.context_window, p?.context_window, fmtTokens, true),
    numRow("最大输出", m.specs.max_output, p?.max_output, fmtTokens, true),
    numRow("输入价格 / 百万 token", m.specs.pricing.input_per_mtok, p?.pricing.input_per_mtok, fmtPrice, false),
    numRow("输出价格 / 百万 token", m.specs.pricing.output_per_mtok, p?.pricing.output_per_mtok, fmtPrice, false),
    numRow("参数量", m.specs.params_b, p?.params_b, (n) => `${n}B`, true),
    { label: "知识截止", value: m.specs.knowledge_cutoff ?? "未公开", delta: null, better: null },
    { label: "输入模态", value: m.specs.modalities_in.join(" / ") || "未公开", delta: null, better: null },
    { label: "输出模态", value: m.specs.modalities_out.join(" / ") || "未公开", delta: null, better: null },
  ];
}

export interface BenchRow {
  name: string;
  score: number;
  prevScore: number | null;
  reportedBy: "vendor" | "third_party";
  source: string;
}

/** 仅当前代有同名、同来源类型的分数时才给出对比，避免把厂商自报和第三方混比 */
export function benchRows(m: Model, prev: Model | null): BenchRow[] {
  return m.benchmarks.map((b) => {
    const pb = prev?.benchmarks.find((x) => x.name === b.name && x.reported_by === b.reported_by);
    return { name: b.name, score: b.score, prevScore: pb?.score ?? null, reportedBy: b.reported_by, source: b.source };
  });
}
