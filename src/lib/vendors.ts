import type { Tier, Vendor } from "./schema";

export const VENDOR_META: Record<Vendor, { label: string; color: string }> = {
  anthropic: { label: "Anthropic", color: "#D97757" },
  openai: { label: "OpenAI", color: "#10A37F" },
  google: { label: "Google", color: "#4285F4" },
  meta: { label: "Meta", color: "#8B5CF6" },
  deepseek: { label: "DeepSeek", color: "#4D6BFE" },
  qwen: { label: "Qwen", color: "#E8A33D" },
  moonshot: { label: "Kimi", color: "#5AA8F2" },
  zhipu: { label: "Z.ai", color: "#35C7B2" },
  minimax: { label: "MiniMax", color: "#F47BA8" },
  bytedance: { label: "Seed", color: "#F08B4B" },
  baidu: { label: "ERNIE", color: "#5F91FF" },
  tencent: { label: "Hunyuan", color: "#48C2D5" },
  xai: { label: "xAI", color: "#D7D8DC" },
  mistral: { label: "Mistral", color: "#F7A13C" },
  cohere: { label: "Cohere", color: "#B995D8" },
  amazon: { label: "Amazon", color: "#FFB34E" },
  microsoft: { label: "Microsoft", color: "#7AB8F5" },
  ibm: { label: "IBM", color: "#9B8BFA" },
  nvidia: { label: "NVIDIA", color: "#76B900" },
};

export const TIER_LABEL: Record<Tier, string> = {
  flagship: "旗舰",
  mid: "中档",
  small: "小型",
};
