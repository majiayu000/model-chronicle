# 数据收录状态（2026-09-30）

> 2026-10-01 局部补核：DeepSeek-V4.1-Flash 的[官方模型卡](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/raw/main/README.md)补入 GPQA Diamond 90.9（Instruct、最大推理强度 100）、40 层架构、384 个路由专家/6 个激活/1 个共享专家及关键变化。552B 明确为主干参数，另有 196B 条件记忆，因此移除把主干当作整模总参数的 `params_b` 与 `arch.total`；预填充 8B、解码 16B 的激活量只作文字说明。未将 Base 模型的 MMLU-Pro/HumanEval 转填给 Instruct，也未因同表出现而新增可比组。未重新核对该条全部日期事实，保留原 `verified_at`。下文仍为 9 月 30 日快照；当前有基准记录 46、部分评测条件 6、关键变化 172、总参数量 150，完整可比模型仍为 2。当前精确统计以生成的 `dataset/coverage.json` 为准。

此快照按 [数据 Schema](DATA_SCHEMA.md) 的二十八家厂商、2022-11 起的通用语言模型范围统计。一个 YAML 代表一个独立命名的模型；日期快照通常不单列，官方作为新版本发布的例外。

## 当前工作区

| 厂商 | YAML 数 |
|---|---:|
| Anthropic | 25 |
| OpenAI | 40 |
| Google | 32 |
| Meta | 21 |
| DeepSeek | 15 |
| Qwen | 34 |
| Kimi / Moonshot | 5 |
| Z.ai / GLM | 9 |
| MiniMax | 6 |
| ByteDance Seed | 6 |
| Baidu ERNIE | 4 |
| Tencent Hunyuan | 2 |
| xAI Grok | 11 |
| Mistral | 12 |
| Cohere | 4 |
| Amazon | 9 |
| Microsoft Phi | 5 |
| IBM Granite | 2 |
| NVIDIA Nemotron | 3 |
| 阶跃星辰 / StepFun | 4 |
| 讯飞星火 | 11 |
| AI21 | 11 |
| Ai2 | 14 |
| 零一万物 / Yi | 10 |
| 书生浦语 / InternLM | 7 |
| 百川智能 | 3 |
| TII / Falcon | 4 |
| Liquid AI | 7 |
| **合计** | **316** |

原设计稿中的 58 条示意记录均已转为独立 YAML，并补入 Llama 3.2 1B 等后续确认的型号。此前依据厂商发布页、官方文档与模型卡增加了 13 家厂商的 69 条记录；9 月 30 日先补入下列 5 条近期发布，随后按缺漏核查补入 9 家新厂商和 83 条记录；详见 [覆盖核查](COVERAGE_AUDIT_2026-09-30.md)。页面只读取通过构建校验的 YAML，不再把设计稿中的示意价格、基准或生命周期日期用于统计。

| 字段 | 已填写模型数 / 316 |
|---|---:|
| 宣布日期 | 314 |
| 正式可用日期 | 284 |
| 上下文窗口 | 198 |
| 最大输出 | 60 |
| 参数量 | 151 |
| 输入和输出价格均有值 | 64 |
| 知识截止月份 | 33 |
| 有多次有来源价格观测 | 1 |
| 至少一项白名单基准 | 45 |
| 至少一项评测条件有记录 | 5 |
| 至少一项同条件基准 | 2 |
| 有架构资料 | 68 |
| 有关键变化短句 | 171 |
| 有官方弃用或下线日期 | 29 |

`null` 和空数组表示未获得足以填写的资料，不能按零解释。价格按 Schema 记录发布时标准 API 文本 token 价；多地区、长上下文、缓存和促销价无法用现有两个价格字段完整表达。基准分数保留来源的报告者类型。已核实的对照组只有 Claude Opus 4 与 Sonnet 4 的 SWE-bench Verified（500 道题、相同工具脚手架、无扩展思考；见 [Anthropic 发布文及附录](https://www.anthropic.com/news/claude-4)）；其余记录仍只展示原始观测点，不参与跨模型比较。

GPT-5 mini 的 SWE-bench Verified，以及 GPT-5 nano 的 SWE-bench Verified、GPQA Diamond 和 AIME 2025 分数已按 [OpenAI 发布表](https://openai.com/index/introducing-gpt-5-for-developers/) 补入。该表的 SWE-bench Verified 使用 477/500 道题，与上述 Claude 4 的 500 道题结果不属于同一对照组。

同一发布表明确标注 GPT-5、GPT-5 mini、GPT-5 nano 的 AIME 2025 与 GPQA Diamond 为 high 推理强度、无工具，因此这 3 个型号的上述 6 条分数补记了已知评测条件。来源未完整说明评测框架，故仍不赋予 `comparison_group`，可比模型数保持 2。

## 可核实性与剩余边界

- 每条记录至少有一个来源 URL；构建检查字段结构、日期顺序、继任关系，以及基准和架构来源是否列在该记录的 `sources` 中。它不自动证明网页内容逐项支持每个字段，也不判定链接是否为厂商官方页面。
- 厂商没有统一的“全部主力模型”清单，“主力”及尺寸变体的界限仍需人工维护。本文件的 316 是当前收录数，不是行业模型总数，也不能证明二十八家厂商旗下型号已经穷尽。
- 生命周期覆盖 12 个 Anthropic、11 个 OpenAI 和 6 个 Google 型号。未来下线日期不提前判为已下线；实验型号缺少 GA 日期不影响已核实的下线状态。没有状态依据的记录仍显示“状态未核实”。
- 架构图只使用 YAML 中带来源的架构字段；没有可核实细节的型号不应从设计稿补值。
- GPT-4o 的价格历史记录了 2024-05-13 发布价及 2024-10-01 官方价格表对 `gpt-4o-2024-08-06` 快照的观测值；后者的日期是来源发布日期，并非价格生效日，也不代表当前价格。
- Gemini 2.5 Flash 增加了 2025-06-17 稳定版价格观测；早期预览版按思考模式分档，发布价继续保持未知。多次观测模型数仍为 1，不用重复记录人为提高覆盖率。
- 本次生命周期、17 条知识截止与 3 组发布价的逐项依据及未补值原因见 [字段复核记录](DATA_REVIEW_2026-09-27.md)。同条件基准仍为 2，不能通过放宽评测条件提高这个数字。
- 每周来源链接检查只报告可达、需人工复核或访问不确定；HTTP 可达不能证明字段值正确。

重新统计可运行 `bun run data` 后读取 `src/generated/models.json`；构建产物不纳入版本控制。


## 2026-09-30 近期发布更新依据

本次以 9 月 16 日至 30 日的官方发布为入口，补入三条新发布及核查时发现的两条 8 月漏收记录，未重新审计全部历史数据。

| 新增模型 | 宣布 / 公开可用日期 | 已核实内容与来源 |
|---|---|---|
| GPT-6.1 Sol | 2026-09-29 | [API 更新日志](https://developers.openai.com/api/docs/changelog)确认 9 月 29 日发布；[发布文](https://openai.com/index/introducing-gpt-6-1-sol/)确认公开可用及标准输入／输出价格 2／10 美元每百万 token；[型号文档](https://developers.openai.com/api/docs/models/gpt-6.1-sol)确认 105 万上下文、128K 输出、图文输入和 2026-04 知识截止。价格适用于输入不超过 272K 的标准请求。继任 GPT-6 Sol。 |
| Claude Sonnet 5.5 | 2026-09-28 | [发布文](https://www.anthropic.com/claude-sonnet-5-5)确认发布、可用性及 2 / 10 美元每百万 token 的发布价；[模型文档](https://platform.claude.com/docs/en/models/overview)确认 1M 上下文、128K 输出、图文输入与 2026-06 知识截止。继任 Sonnet 5。 |
| Qwen3.8-Omni-Flash | 2026-09-18 | Qwen 官方研究列表标注 9 月 18 日，[原文入口](https://qwen.ai/blog?id=qwen3.8-omni-flash)；[阿里云官方转载](https://www.alibabacloud.com/blog/qwen3-8-omni-flash-omni-senses--agentic-delivery-_603580)日期为 9 月 20 日，不作为首发日期。[型号文档](https://www.alibabacloud.com/help/en/model-studio/qwen3-8-omni-flash)确认 1M 上下文、131072 输出、四种输入模态和文本输出。 |
| GLM-5.3 | 2026-08-14 | [发布博客](https://z.ai/blog/glm-5.3)当日宣布发布并开放 Coding Plan；[API 更新日志](https://docs.z.ai/release-notes/new-released)另列 8 月 18 日，不能反推首发。当前[官方权重](https://huggingface.co/zai-org/GLM-5.3)已公开；[型号文档](https://docs.z.ai/guides/llm/glm-5.3)确认文本输入、1M 上下文、128K 输出及始终启用推理。继任 GLM-5.2。 |
| GLM-5.3-Flash | 2026-08-26 | [发布博客](https://z.ai/blog/glm-5.3-flash)与 [API 更新日志](https://docs.z.ai/release-notes/new-released)确认日期；[型号文档](https://docs.z.ai/guides/vlm/glm-5.3-flash)确认 1M 上下文、128K 输出、图像/视频/文本输入及总参数 320B；[官方模型卡](https://huggingface.co/zai-org/GLM-5.3-Flash)确认权重公开。 |

- GLM-5.3 属于旗舰档；GLM-5.3-Flash 和 Qwen3.8-Omni-Flash 按低成本定位归入 small，这是本库的分类判断。两个 Flash 型号未建立未经核实的同档位前代连线。
- 除 Sonnet 5.5 和 GPT-6.1 Sol 外，未核实其余三条的发布时标准美元文本 API 价格，继续留空。未将当前价、促销价或多模态价格填成发布价。
- 新发布文中的 Terminal-Bench、FrontierCode、DeepSWE、OSWorld 等不在当前基准白名单。GLM-5.3-Flash 博客的 MMLU 表属于 Base 模型，不转填到对话模型；这五条的 benchmarks 保持空数组。
- MiniMax M3.1-Flash-Preview 本次仅找到二手报道，未获得足够的官方发布依据，暂未收录。官方文档中的 GLM-5.3-FlashX 是加速服务变体，本次未将其作为独立主力模型新增。
- Google 近期 Live/TTS、Qwen 图像及专用翻译发布按现有通用 LLM 收录范围未新增；已有的 GPT-6 Sol/Luna、Opus 5.5、Grok 4.7 未重复建档。


## 2026-09-30 厂商与历史缺漏补录

新增 83 条：StepFun 4、讯飞 11、AI21 11、Ai2 14、Yi 10、InternLM 7、百川 3、Falcon 4、Liquid AI 7，以及已有厂商的 12 条缺漏。数据 Schema、筛选菜单和系列显示名已同步接入；GLM-5 → 5.1 → 5.2 的版本连线已补齐。

日期窗口仍为默认最近 12 个月；“全部历史”包含全部 316 条数据。默认窗口内没有发布的厂商仍保留历史入口。完整来源清单、日期口径差异及待核查项见 [覆盖核查](COVERAGE_AUDIT_2026-09-30.md)。厂商数、模型数以及通过测试均不能作为收录穷尽的证明。
