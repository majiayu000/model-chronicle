import type { Model } from "./schema";

const DAY_MS = 86_400_000;

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** 模型的“发布日”：优先 GA，缺失时用 announced */
export function releaseDate(m: Model): string {
  const d = m.dates.ga ?? m.dates.announced;
  if (d === null) throw new Error(`${m.id} 缺少 ga 和 announced`);
  return d;
}

export function isDayPrecision(d: string): boolean {
  return d.length === 10;
}

/** 用于绘图的时间戳；只知道月份时取当月 15 日 */
export function toTime(d: string): number {
  return Date.parse(isDayPrecision(d) ? d : `${d}-15`);
}

export type Gap =
  | { kind: "exact"; days: number }
  | { kind: "approx"; months: number };

/** 两个日期的间隔；任一端只有月份精度时返回近似月数，不伪造天数 */
export function gapBetween(from: string, to: string): Gap {
  if (isDayPrecision(from) && isDayPrecision(to)) {
    return { kind: "exact", days: Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS) };
  }
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  return { kind: "approx", months: (ty - fy) * 12 + (tm - fm) };
}

export function formatGap(g: Gap): string {
  return g.kind === "exact" ? `${g.days} 天` : `约 ${g.months} 个月`;
}

export function byRelease(a: Model, b: Model): number {
  return toTime(releaseDate(a)) - toTime(releaseDate(b));
}

export interface Succession {
  from: Model;
  to: Model;
  gap: Gap;
}

/** 基于人工标注的 predecessor 字段，生成所有“同档位继任”关系 */
export function successions(models: Model[]): Succession[] {
  const byId = new Map(models.map((m) => [m.id, m]));
  return models
    .filter((m) => m.predecessor !== null)
    .map((to) => {
      const from = byId.get(to.predecessor!);
      if (!from) throw new Error(`${to.id} 的 predecessor ${to.predecessor} 不存在`);
      return { from, to, gap: gapBetween(releaseDate(from), releaseDate(to)) };
    })
    .sort((a, b) => byRelease(a.to, b.to));
}

/** 厂商节奏：同一厂商按时间排序后相邻两次发布（同日发布合并为一次） */
export function vendorCadence(models: Model[]): Gap[] {
  const dates = [...new Set(models.map(releaseDate))].sort((a, b) => toTime(a) - toTime(b));
  return dates.slice(1).map((d, i) => gapBetween(dates[i], d));
}

/** 只对精确到天的间隔求中位数；没有可用数据返回 null */
export function medianDays(gaps: Gap[]): number | null {
  const days = gaps
    .filter((g): g is Extract<Gap, { kind: "exact" }> => g.kind === "exact")
    .map((g) => g.days)
    .sort((a, b) => a - b);
  if (days.length === 0) return null;
  const mid = Math.floor(days.length / 2);
  return days.length % 2 ? days[mid] : Math.round((days[mid - 1] + days[mid]) / 2);
}

export function successorOf(model: Model, models: Model[]): Model | null {
  return models.find((m) => m.predecessor === model.id) ?? null;
}
