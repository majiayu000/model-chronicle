import { modelSchema, type Model } from "./schema";
import { releaseDate, toTime } from "./intervals";

export interface ValidationResult {
  models: { file: string; model: Model }[];
  errors: string[];
}

/** schema 校验 + 跨文件一致性校验（id 唯一、predecessor 存在且同线、时间先后） */
export function validateModels(raw: { file: string; data: unknown }[]): ValidationResult {
  const errors: string[] = [];
  const models: { file: string; model: Model }[] = [];

  for (const { file, data } of raw) {
    const r = modelSchema.safeParse(data);
    if (r.success) {
      models.push({ file, model: r.data });
    } else {
      for (const issue of r.error.issues) errors.push(`${file}: ${issue.path.join(".")} ${issue.message}`);
    }
  }

  const byId = new Map<string, Model>();
  for (const { file, model } of models) {
    if (byId.has(model.id)) errors.push(`${file}: id "${model.id}" 重复`);
    byId.set(model.id, model);
  }

  const claimed = new Map<string, string>();
  const comparisonGroups = new Map<string, string>();
  for (const { file, model } of models) {
    const d = model.dates;
    const definitelyAfter = (a: string, b: string) => {
      const earliestA = a.length === 7 ? `${a}-01` : a;
      const latestB = b.length === 7 ? new Date(Date.UTC(Number(b.slice(0, 4)), Number(b.slice(5, 7)), 0)).toISOString().slice(0, 10) : b;
      return earliestA > latestB;
    };
    for (const [first, second] of [["announced", "ga"], ["ga", "deprecated"], ["deprecated", "retired"]] as const) {
      if (d[first] && d[second] && definitelyAfter(d[first], d[second])) errors.push(`${file}: ${first} 晚于 ${second}`);
    }
    for (const benchmark of model.benchmarks) {
      if (!model.sources.includes(benchmark.source)) errors.push(`${file}: 基准 ${benchmark.name} 的来源未列在 sources 中`);
      if (benchmark.comparison_group && benchmark.evaluation) {
        const key = `${benchmark.name}/${benchmark.comparison_group}`;
        const settings = JSON.stringify(benchmark.evaluation);
        const previous = comparisonGroups.get(key);
        if (previous && previous !== settings) errors.push(`${file}: 基准 ${benchmark.name} 的 comparison_group 评测条件不一致`);
        comparisonGroups.set(key, settings);
      }
    }
    if (model.predecessor === null) continue;
    const prev = byId.get(model.predecessor);
    if (!prev) {
      errors.push(`${file}: predecessor "${model.predecessor}" 不存在`);
      continue;
    }
    if (prev.vendor !== model.vendor || prev.family !== model.family || prev.tier !== model.tier) {
      errors.push(`${file}: predecessor "${prev.id}" 不在同一 vendor/family/tier`);
    }
    if (toTime(releaseDate(prev)) > toTime(releaseDate(model))) {
      errors.push(`${file}: predecessor "${prev.id}" 发布晚于本模型`);
    }
    const other = claimed.get(prev.id);
    if (other) errors.push(`${file}: "${prev.id}" 已被 "${other}" 声明为前代，一条线不能分叉`);
    claimed.set(prev.id, model.id);
  }

  return { models, errors };
}
