import { z } from "zod";
import { BENCHMARKS, FAMILIES, TIERS, VENDORS } from "./constants";

// YAML 会把未加引号的日期解析成 Date，这里统一转回字符串再校验精度
const partialDate = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
  z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/, "日期必须是 YYYY-MM 或 YYYY-MM-DD"),
);
const month = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 7) : v),
  z.string().regex(/^\d{4}-\d{2}$/, "必须是 YYYY-MM"),
);
const modality = z.enum(["text", "image", "audio", "video", "pdf"]);

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
    benchmarks: z.array(
      z.object({
        name: z.enum(BENCHMARKS),
        score: z.number(),
        reported_by: z.enum(["vendor", "third_party"]),
        source: z.url(),
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
  });

export type Model = z.infer<typeof modelSchema>;
export type Vendor = Model["vendor"];
export type Tier = Model["tier"];
