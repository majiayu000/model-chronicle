export const VENDORS = ["anthropic", "openai", "google", "meta", "deepseek", "qwen"] as const;
export const TIERS = ["flagship", "mid", "small"] as const;
export const BENCHMARKS = [
  "SWE-bench Verified",
  "GPQA Diamond",
  "MMLU",
  "MMLU-Pro",
  "AIME 2024",
  "AIME 2025",
  "MMMU",
  "HumanEval",
] as const;

export const FAMILIES: Record<(typeof VENDORS)[number], readonly string[]> = {
  anthropic: ["claude", "fable"],
  openai: ["gpt", "gpt-pro", "o-series", "o-series-pro", "gpt-oss"],
  google: ["gemini", "gemma", "palm"],
  meta: ["llama"],
  deepseek: ["deepseek-v", "deepseek-r", "deepseek-coder"],
  qwen: ["qwen", "qwq", "qwen-coder"],
};
