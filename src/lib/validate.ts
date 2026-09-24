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
  for (const { file, model } of models) {
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
