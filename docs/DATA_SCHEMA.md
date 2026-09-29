# 数据 Schema

一个模型一个 YAML 文件：`data/models/<vendor>/<id>.yaml`。厂商及产品线取值在 `src/lib/constants.ts`。
构建时 `scripts/build-data.ts` 校验全部文件并编译成 `src/generated/models.json`，校验失败构建即失败。

## 收录范围

- 时间：2022-11 起发布的通用 LLM（含推理模型、开源权重模型）。
- 只收“有独立名字的主力模型”，不收日期快照（如 `gpt-4-0613`），除非该快照被官方当作新模型宣传（如 Claude 3.5 Sonnet 2024-10 版）。
- 不收纯图像/视频/语音/嵌入模型。

## 字段

```yaml
id: claude-3-7-sonnet          # kebab-case，全局唯一，等于文件名
name: Claude 3.7 Sonnet        # 官方展示名
vendor: anthropic              # 取值见 src/lib/constants.ts 的 VENDORS
family: sonnet                 # 产品线，见下方“family 取值”
tier: mid                      # flagship | mid | small
generation: "3.7"              # 字符串形式的代号/版本
predecessor: claude-3-5-sonnet-new   # 同 vendor + family + tier 的上一个模型 id；该线第一个填 null
open_weights: false
reasoning: true                # 可选；官方明确支持推理模式时填写
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
# price_history:               # 可选；只记有日期和来源的标准文本 API 非缓存价
#   - observed_at: 2025-02-24 # 官方来源的观测日期，不推断价格生效日
#     input_per_mtok: 3
#     output_per_mtok: 15
#     source: https://...     # 必须同时列在 sources 中；按观测日期严格递增
#     note: 标准文本 API 价格
arch:                         # 可选；无可核实架构资料时省略
  type: dense                 # dense | moe
  source: https://...        # 必须同时列在 sources 中
  layers: 32                  # 只填写来源明确公开的参数
benchmarks:                    # 只允许下方“基准白名单”里的 name
  - name: SWE-bench Verified
    score: 62.3                # 百分比数值
    reported_by: vendor        # vendor | third_party
    source: https://...
    # evaluation:                # 可选；只填来源明确说明的项目，允许部分已知
    #   benchmark_version: "..." # 试题集/版本
    #   tools: false             # 是否允许外部工具
    #   reasoning_effort: "..."  # 推理设置
    #   harness: "..."           # 评测框架与运行方式
    # comparison_group: "..."    # 只有上述四项均已核实且相同时才能赋予相同组名
highlights:                    # 1~4 条中文短句，描述该模型相对前代的关键变化，必须能在 sources 中找到依据
  - 首个混合推理模型，可切换扩展思考
sources:                       # 至少 1 个官方来源 URL（发布博客/文档/模型卡）
  - https://www.anthropic.com/news/claude-3-7-sonnet
verified_at: 2026-09-24
```

`specs.pricing` 始终是发布价。`price_history` 是逐次核实的历史观测，不等于当前可购买价格；不同缓存、地区、长上下文、批处理或快照价格不可混为一条记录。资料缺失时留空，不从旧观测推断今天的价格。

## family 取值

| vendor | family |
|---|---|
| anthropic | `opus`、`sonnet`、`haiku`、`fable`、`claude`（Claude 2 / 2.1） |
| openai | `gpt`（GPT-3.5/4/4o/4.1/4.5/5…）、`gpt-pro`、`o-series`（o1/o3/o4…）、`o-series-pro`、`gpt-oss` |
| google | `gemini`、`gemma`、`palm` |
| meta | `llama` |
| deepseek | `deepseek-v`（V2/V3…）、`deepseek-r`（R1…）、`deepseek-coder` |
| qwen | `qwen`、`qwq`、`qwen-coder` |
| moonshot | `kimi`、`kimi-thinking` |
| zhipu | `glm`、`glm-air` |
| minimax | `minimax-m` |
| bytedance | `seed`、`seed-vl` |
| baidu | `ernie`、`ernie-x`、`ernie-open` |
| tencent | `hunyuan-t`、`hunyuan-a` |
| xai | `grok`、`grok-fast` |
| mistral | `mistral-large`、`mistral-medium`、`mistral-small`、`mistral-nemo`、`mistral-7b`、`mixtral` |
| cohere | `command`、`command-a` |
| amazon | `nova`、`titan-text` |
| microsoft | `phi` |
| ibm | `granite` |
| nvidia | `nemotron` |
| stepfun | `step` |
| iflytek | `spark`、`spark-x` |
| ai21 | `jurassic`、`jamba` |
| allenai | `olmo`、`olmoe`、`olmo-think`、`olmo-hybrid` |
| 01ai | `yi`、`yi-vl` |
| internlm | `internlm` |
| baichuan | `baichuan` |
| tii | `falcon` |
| liquid | `lfm`、`lfm-vl`、`lfm-thinking` |

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
4. 预览发布与正式可用分开记录：`announced` 填发布或预览日，`ga` 仅在来源明确可公开使用时填写。
5. `verified_at` 表示本条已填写事实的核对时间；`null` 仍表示未知，不能被页面用示意值替代。
6. `evaluation` 可以只记录已知条件；未填写 `comparison_group` 的分数仍仅作为来源观测点展示，不参与最高分、开源追赶、能力成本或前代分差计算。组名必须对应完整 `evaluation`，同组四项设置必须一致；不能仅因基准名称相同或同一张表就归入同组。

生命周期日期采用厂商 API 的确切公告口径。不得将 ChatGPT 等消费产品下架、单个日期快照停用或最早可能下线日直接推广为整个型号的 API 下线日期。实验型号即使没有 GA 日期，也可以有明确的弃用/下线记录。

## CSV 导出

JSON 与 CSV 均按模型 `id` 的固定字符顺序导出，不依赖文件系统顺序。CSV 保留原先的前 11 列，扩为 27 列：新增 generation、predecessor、open_weights、reasoning、deprecated、retired、context_window、max_output、knowledge_cutoff、params_b、modalities_in、modalities_out、architecture、benchmarks、price_history、highlights。

空单元格表示 null 或未提供；数字 0 与布尔 false 保留。模态、架构、基准（含评测条件与来源）、价格历史和关键变化使用单元格内 JSON；sources 延续 ` | ` 分隔。采用双引号包裹并转义逗号、引号和换行，读取时应使用 CSV 解析器。价格列仍为发布价，价格历史不能覆盖它。
