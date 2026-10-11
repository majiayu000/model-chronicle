# 模型增量复核（2026-10-11）

首轮新增 3 个明确命名的通用模型，并补充 4 条已有记录的生命周期公告，模型数从 316 增至 319。随后补录 MiniMax M3.1 Flash Preview，当前共 320 条，厂商数仍为 28；未逐项重审全部历史记录，也不代表已穷尽各厂商型号。

## 新增模型

| 模型 | 宣布日期 | 截至核查日的可用性 | 来源 |
|---|---|---|---|
| Claude Haiku 5.5 | 2026-10-07 | 已公开可用；图文输入、文本输出、百万上下文、128K 输出、2026-06 知识截止 | [发布文](https://www.anthropic.com/claude-haiku-5-5)、[型号文档](https://platform.claude.com/docs/en/models/haiku-5-5/overview) |
| Gemini 4 Argon | 2026-09-30 | Fairwind 计划受邀伙伴访问，公开可用日期留空；百万 token 最大输出 | [全球发布文](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/)、[DeepMind 型号页](https://deepmind.google/models/gemini/) |
| Mistral Large 4 | 2026-10-06 | API 公开预览，正式可用日期留空；权重计划月底发布，截至本次核查 `open_weights: false` | [发布文](https://mistral.ai/news/mistral-large-4/)、[型号文档](https://docs.mistral.ai/models/mistral-large) |

### 字段口径

- Haiku 5.5 的发布价字段记录提示词不超过 100K 时的标准输入／输出价 0.10／0.50 美元每百万 token；超过 100K 的 0.50／2.50 美元分档写入关键变化说明。现有计算器不支持长上下文阶梯，不能将低档价格用于全部百万上下文请求。普通最大输出为 128K，未将需要 beta header 的 Batch 300K 输出填作常规规格。
- Argon 的 1M 是官方明确的**最大输出**，未把它推断成上下文窗口。输入模态只填发布文明确支持的文本、图像与视频；上下文上限、音频、参数量和知识截止未核实。官方预告的 2／10 美元引入期价及之后的 4／20 美元只写入说明，尚未公开可用，不填为已生效的标准发布价。9 月 30 日采用全球原文，部分地区转载的 10 月 1 日不作为首发日期。
- Mistral Large 4 的型号文档明确列出百万上下文、1.05T 总参数；发布文使用约 1T 的概数。当前通用型号页写 52B 激活参数，另一[版本页面](https://docs.mistral.ai/models/mistral-large-4-0)仍写 49B，本次不填 `arch.active`。最大输出与知识截止未核实，保持空值。
- Mistral 发布文列出的标准输入／输出价格为 1.36／4.18 美元每百万 token；型号页同时列原价和 0.68／2.09 美元促销价，促销不覆盖标准发布价。公开预览与未来权重发布不等于已正式可用或已公开权重。
- 三条新记录分别连接 Haiku 4.5、Gemini 3.1 Pro、Mistral Large 3，属于本库同系列同档位演进的分类判断，不表示厂商迁移建议。新发布页主要使用的评测不在现有基准白名单内，本次 `benchmarks` 保持空数组。

## 生命周期补充

| 模型 | 本次补充 | 官方依据 |
|---|---|---|
| GPT-5.1、GPT-5.4 nano | 2026-10-01 宣布弃用，计划 2027-04-01 从 API 下线 | [OpenAI 弃用公告](https://developers.openai.com/api/docs/deprecations) |
| Gemini 3.5 Flash | 2026-10-08 弃用，请求自动路由至 Gemini 3.6 Flash | [Gemini API 更新日志](https://ai.google.dev/gemini-api/docs/changelog) |
| Gemini 3.7 Flash | 2026-10-08 弃用，请求自动路由至 Gemini 3.8 Flash | [Gemini API 更新日志](https://ai.google.dev/gemini-api/docs/changelog) |

OpenAI 的未来下线日期不表示现在已下线。Google 的自动路由公告未给独立 API 下线日期，`retired` 继续留空。四条已有记录仅复核上述增量事实，保留原 `verified_at`，不将局部修正声明为全字段重审。

本次沿用现有 YAML、生成页面与校验流程。全量来源链接检查不证明模型数据已跟上新发布；未增加自动抓取或定时补录功能。

## MiniMax M3.1 Flash Preview 补录

- 原因：9 月 30 日收录记录明确将本型号列为“官方发布依据不足，暂未收录”；首轮 10 月 11 日增量更新未重新核实该待办。数据源确实缺少条目，不是搜索、筛选或页面缓存问题。
- [MiniMax 官方发布帖](https://x.com/MiniMaxAgent/status/2104079819881517400)确认 2026-09-27 在 MiniMax Code 首发。本次通过 X 官方 oEmbed 接口读回正文、作者与日期；网页读取的 403 不作为发布内容依据。
- [官方调用文档](https://platform.minimax.io/docs/guides/text-generation)确认完整 API 名称 `MiniMax-M3.1-Flash-Preview`、1,000,000 token 上下文、文本／图像／视频输入、文本输出及五档 `effort`。推理不能关闭，默认 `max`；当前访问渠道为 M Plan 和 MiniMax Code，[M Plan 页面](https://www.minimax.io/m-plan)可交叉确认。
- 沿用公开预览记录的日期口径：`announced: 2026-09-27`，`ga: null`，明确预览已可用，不宣称正式版已发布。最大输出、参数量、知识截止和标准按 token 发布价未核实，继续留空；不将 M3 的权重、规格、价格或跑分继承给本型号。
- 根据官方快速日常开发定位，将 Flash 归入本库 `small` 档，这是目录分类判断；未确认同档位前代，`predecessor: null`，不凭版本号建立 M3 旗舰的替代连线。
- 补录验证：`bun run build` 与 `bun run test:unit` 通过（13 个测试文件、104 项测试），生成 320 条模型、MiniMax 7 条；已检查型号页、模型索引、厂商页、系列页、近期发布、sitemap、两份 RSS 与 CSV 均包含新条目，JSON 保留预览日期和价格空值。

## 首轮验证

- `bun run build` 通过：校验并生成 319 条模型记录、独立页面及生产构建。
- `bun run test:unit` 通过：13 个测试文件、104 项测试；时间轴完整收录检查的观察日更新至 10 月 11 日，Google 筛选计数同步新增 Argon。
- `bun run format:check` 与 `git diff --check` 通过。
- 检查生产产物中三款新模型的资料页、索引、近期发布、站点地图、两份 RSS、前代链接和来源；Argon 与 Mistral 的正式可用字段保持未核实。四条生命周期变更已进入生成页面。
