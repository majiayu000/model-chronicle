export const VENDORS = [
  "anthropic", "openai", "google", "meta", "deepseek", "qwen",
  "moonshot", "zhipu", "minimax", "bytedance", "baidu", "tencent",
  "xai", "mistral", "cohere", "amazon", "microsoft", "ibm", "nvidia",
] as const;
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
  moonshot: ["kimi", "kimi-thinking"],
  zhipu: ["glm", "glm-air"],
  minimax: ["minimax-m"],
  bytedance: ["seed", "seed-vl"],
  baidu: ["ernie", "ernie-x", "ernie-open"],
  tencent: ["hunyuan-t", "hunyuan-a"],
  xai: ["grok", "grok-fast"],
  mistral: ["mistral-large", "mistral-medium", "mistral-small", "mistral-nemo", "mistral-7b", "mixtral"],
  cohere: ["command", "command-a"],
  amazon: ["nova", "titan-text"],
  microsoft: ["phi"],
  ibm: ["granite"],
  nvidia: ["nemotron"],
};
