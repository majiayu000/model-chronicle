import raw from "../generated/models.json";
import type { Model } from "./schema";

// 由 scripts/build-data.ts 校验后生成，这里信任其结构
export const MODELS = raw as Model[];
