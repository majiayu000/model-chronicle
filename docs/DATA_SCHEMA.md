# 数据 Schema

一个模型一个 YAML 文件：`data/models/<vendor>/<id>.yaml`。厂商元数据在 `data/vendors.yaml`。
构建时 `scripts/build-data.ts` 校验全部文件并编译成 `src/generated/models.json`，校验失败构建即失败。

## 收录范围

- 时间：2022-11 起发布的通用 LLM（含推理模型、开源权重模型）。
- 只收“有独立名字的主力模型”，不收日期快照（如 `gpt-4-0613`），除非该快照被官方当作新模型宣传（如 Claude 3.5 Sonnet 2024-10 版）。
- 不收纯图像/视频/语音/嵌入模型。

## 字段

```yaml
id: claude-3-7-sonnet          # kebab-case，全局唯一，等于文件名
name: Claude 3.7 Sonnet        # 官方展示名
vendor: anthropic              # anthropic | openai | google | meta | deepseek | qwen
family: claude                 # 产品线，见下方“family 取值”
tier: mid                      # flagship | mid | small
generation: "3.7"              # 字符串形式的代号/版本
predecessor: claude-3-5-sonnet-new   # 同 vendor + family + tier 的上一个模型 id；该线第一个填 null
open_weights: false
dates:
  announced: 2025-02-24        # YYYY-MM-DD 或 YYYY-MM（只知道月份时）；未知 null
  ga: 2025-02-24               # 正式可用（API/产品对公众开放）；未知 null
  deprecated: null             # 官方宣布弃用日期
  retired: null                # 官方下线日期
specs:
  context_window: 200000       # token 数；未公开 null
  max_output: null
  modalities_in: [text, image] # text | image | audio | video | pdf
  modalities_out: [text]       # text | image | audio
  knowledge_cutoff: null       # YYYY-MM 或 null
  params_b: null               # 参数量（十亿），仅官方公开时填写；MoE 填总参数
  pricing:                     # 美元 / 百万 token，发布时官方 API 价格；未知 null
    input_per_mtok: null
    output_per_mtok: null
benchmarks:                    # 只允许下方“基准白名单”里的 name
  - name: SWE-bench Verified
    score: 62.3                # 百分比数值
    reported_by: vendor        # vendor | third_party
    source: https://...
highlights:                    # 1~4 条中文短句，描述该模型相对前代的关键变化，必须能在 sources 中找到依据
  - 首个混合推理模型，可切换扩展思考
sources:                       # 至少 1 个官方来源 URL（发布博客/文档/模型卡）
  - https://www.anthropic.com/news/claude-3-7-sonnet
verified_at: 2026-09-24
```

## family 取值

| vendor | family |
|---|---|
| anthropic | `claude` |
| openai | `gpt`（GPT-3.5/4/4o/4.1/4.5/5…）、`o-series`（o1/o3/o4…）、`gpt-oss` |
| google | `gemini`、`gemma`、`palm` |
| meta | `llama` |
| deepseek | `deepseek-v`（V2/V3…）、`deepseek-r`（R1…）、`deepseek-coder` |
| qwen | `qwen`、`qwq`、`qwen-coder` |

## tier 判定

- `flagship`：该产品线当时能力最强的档位（Opus、GPT-4/4o/5、Gemini Ultra/Pro、Llama 最大尺寸）。
- `mid`：均衡档（Sonnet、Gemini Flash、Llama 中尺寸）。
- `small`：小/快/便宜档（Haiku、*-mini、*-nano、Flash-Lite、Llama 小尺寸）。

## 基准白名单

`SWE-bench Verified`、`GPQA Diamond`、`MMLU`、`MMLU-Pro`、`AIME 2024`、`AIME 2025`、`MMMU`、`HumanEval`

## 硬规则

1. 不确定就填 `null`，不要猜，不要估算。
2. 日期只写能从来源确认的精度；只知道月份就写 `YYYY-MM`。
3. `predecessor` 是人工判断的“同档位上一代”，不是按名字推断。
