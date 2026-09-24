import type { Tier, Vendor } from "./schema";

export const VENDOR_META: Record<Vendor, { label: string; color: string }> = {
  anthropic: { label: "Anthropic", color: "#D97757" },
  openai: { label: "OpenAI", color: "#10A37F" },
  google: { label: "Google", color: "#4285F4" },
  meta: { label: "Meta", color: "#8B5CF6" },
  deepseek: { label: "DeepSeek", color: "#4D6BFE" },
  qwen: { label: "Qwen", color: "#E8A33D" },
};

export const TIER_LABEL: Record<Tier, string> = {
  flagship: "旗舰",
  mid: "中档",
  small: "小型",
};
