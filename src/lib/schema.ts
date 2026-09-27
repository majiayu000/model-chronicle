import { z } from "zod";
import { BENCHMARKS, FAMILIES, TIERS, VENDORS } from "./constants";

// YAML 会把未加引号的日期解析成 Date，这里统一转回字符串再校验精度
const partialDate = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
  z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/, "日期必须是 YYYY-MM 或 YYYY-MM-DD").refine((v) => {
    const [year, month, day] = v.split("-").map(Number);
    if (month < 1 || month > 12) return false;
    return day === undefined || new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10) === v;
  }, "日期不存在"),
);
const month = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 7) : v),
  z.string().regex(/^\d{4}-\d{2}$/, "必须是 YYYY-MM"),
);
const modality = z.enum(["text", "image", "audio", "video", "pdf"]);
const architecture = z.object({
  type: z.enum(["dense", "moe"]),
  source: z.url(),
  total: z.number().positive().optional(),
  active: z.number().positive().optional(),
  experts: z.number().int().positive().optional(),
  topk: z.number().int().positive().optional(),
  shared: z.number().int().nonnegative().optional(),
  layers: z.number().int().positive().optional(),
  d: z.number().int().positive().optional(),
  heads: z.number().int().positive().optional(),
  kv: z.number().int().positive().optional(),
  attn: z.enum(["MHA", "GQA", "MLA"]).optional(),
  tokens: z.number().positive().optional(),
  ctxTrain: z.number().int().positive().optional(),
  vocab: z.number().int().positive().optional(),
  vision: z.enum(["early", "adapter"]).optional(),
  interleave: z.boolean().optional(),
  mtp: z.boolean().optional(),
}).strict();

export const modelSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "id 必须是 kebab-case"),
    name: z.string().min(1),
    vendor: z.enum(VENDORS),
    family: z.string(),
    tier: z.enum(TIERS),
    generation: z.coerce.string(),
    predecessor: z.string().nullable(),
    open_weights: z.boolean(),
    arch: architecture.nullable().optional(),
    reasoning: z.boolean().optional(),
    dates: z.object({
      announced: partialDate.nullable(),
      ga: partialDate.nullable(),
      deprecated: partialDate.nullable(),
      retired: partialDate.nullable(),
    }),
    specs: z.object({
      context_window: z.number().int().positive().nullable(),
      max_output: z.number().int().positive().nullable(),
      modalities_in: z.array(modality),
      modalities_out: z.array(modality),
      knowledge_cutoff: month.nullable(),
      params_b: z.number().positive().nullable(),
      pricing: z.object({
        input_per_mtok: z.number().nonnegative().nullable(),
        output_per_mtok: z.number().nonnegative().nullable(),
      }),
    }),
    price_history: z.array(z.object({
      observed_at: partialDate,
      input_per_mtok: z.number().nonnegative(),
      output_per_mtok: z.number().nonnegative(),
      source: z.url(),
      note: z.string().max(120).optional(),
    }).strict()).optional(),
    benchmarks: z.array(
      z.object({
        name: z.enum(BENCHMARKS),
        score: z.number().min(0).max(100),
        reported_by: z.enum(["vendor", "third_party"]),
        source: z.url(),
        evaluation: z.object({
          benchmark_version: z.string().min(1).optional(),
          tools: z.boolean().optional(),
          reasoning_effort: z.string().min(1).optional(),
          harness: z.string().min(1).optional(),
        }).strict().optional(),
        comparison_group: z.string().min(1).optional(),
      }).refine((b) => !b.comparison_group || !!(b.evaluation?.benchmark_version && b.evaluation.tools !== undefined && b.evaluation.reasoning_effort && b.evaluation.harness), {
        message: "comparison_group 需要完整 evaluation 条件",
        path: ["comparison_group"],
      }),
    ),
    highlights: z.array(z.string()).max(4),
    sources: z.array(z.url()).min(1),
    verified_at: partialDate,
  })
  .strict()
  .refine((m) => FAMILIES[m.vendor].includes(m.family), {
    message: "family 不在该 vendor 的取值范围内",
    path: ["family"],
  })
  .refine((m) => m.dates.announced !== null || m.dates.ga !== null, {
    message: "announced 和 ga 至少要有一个",
    path: ["dates"],
  })
  .refine((m) => !m.arch || m.sources.includes(m.arch.source), {
    message: "架构来源必须列在 sources 中",
    path: ["arch", "source"],
  })
  .refine((m) => (m.price_history ?? []).every((p, i, a) => i === 0 || p.observed_at > a[i - 1].observed_at), {
    message: "价格观测日期必须严格递增",
    path: ["price_history"],
  })
  .refine((m) => (m.price_history ?? []).every((p) => m.sources.includes(p.source)), {
    message: "价格来源必须列在 sources 中",
    path: ["price_history"],
  })
  .refine((m) => (m.price_history ?? []).every((p) => {
    const release = m.dates.announced ?? m.dates.ga;
    if (!release) return true;
    const n = Math.min(release.length, p.observed_at.length);
    return p.observed_at.slice(0, n) >= release.slice(0, n);
  }), {
    message: "价格观测不能早于模型宣布日期",
    path: ["price_history"],
  });

export type Model = z.infer<typeof modelSchema>;
export type Vendor = Model["vendor"];
export type Tier = Model["tier"];
