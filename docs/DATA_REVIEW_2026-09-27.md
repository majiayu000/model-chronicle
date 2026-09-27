# 2026-09-27 字段复核

本次只补核以下字段，未重新逐项审阅每个模型的全部旧数据，因此不批量刷新 `verified_at`。这里记录新字段的复核时间，YAML 的 `sources` 保留具体依据。

## 生命周期

依据 [OpenAI API 弃用记录](https://developers.openai.com/api/docs/deprecations)：

| 模型 | 弃用公告 | API 下线（含已公布的未来日期） |
|---|---|---|
| GPT-4.5（gpt-4.5-preview） | 2025-04-14 | 2025-07-14 |
| o1-preview | 2025-04-28 | 2025-07-28 |
| o1-mini | 2025-04-28 | 2025-10-27 |
| GPT-3.5 Turbo、GPT-4、GPT-4 Turbo、GPT-4.1 nano、o1、o1-pro、o3-mini、o4-mini | 2026-04-22 | 2026-10-23 |

2026-04-22 公告明确列出上述无日期别名，才映射到目录记录。只列出日期快照的 GPT-4o、GPT-5 和 o3 公告不推广为整个型号的生命周期；ChatGPT 产品里的退出时间也不写成 API 下线。

依据 [Google Gemini API 发布记录](https://ai.google.dev/gemini-api/docs/changelog)：

| 模型 | 弃用公告 | API 下线 |
|---|---|---|
| Gemini 1.5 Pro、1.5 Flash | 未补值 | 2025-09-29 |
| Gemini 2.0 Flash、2.0 Flash-Lite | 2026-02-18 | 2026-06-01 |
| Gemini 2.0 Pro（实验端点） | 2025-11-04 | 2025-12-09 |
| Gemini 3 Pro（预览端点） | 2026-02-26 | 2026-03-09 |

Gemini 3 Pro 的旧别名转指 3.1 Pro，不代表原模型仍在运行。Gemini 2.0 Pro 没有正式可用日期，但有明确实验端点下线公告，页面应显示已下线。[弃用表](https://ai.google.dev/gemini-api/docs/deprecations) 的“最早可能下线日期”不能一律解释成已实际下线；本次使用发布日志的确切公告。Gemini 2.5 的访问限制也不等于弃用。

## 知识截止

逐个读取 `https://developers.openai.com/api/docs/models/<model>` 的 knowledge cutoff 字段，按 Schema 保留月份：

| 模型 | 月份 |
|---|---|
| GPT-4o、GPT-4o mini、o1、o1-mini、o1-preview、o3-mini | 2023-10 |
| GPT-4 Turbo | 2023-12 |
| GPT-4.1、GPT-4.1 mini、GPT-4.1 nano、o3、o4-mini | 2024-06 |
| GPT-5 | 2024-09 |
| GPT-5 mini、GPT-5 nano | 2024-05 |

[Gemini 2.5 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash) 与 [Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-lite) 文档明确为 2025-01。旧 GPT-4、GPT-3.5 的别名与历史快照规格存在差异，本次没有用今天的别名页面补其历史规格。GPT-4.5 文档读取失败，知识截止继续为空。

## 价格与可用日期

- [Gemini 2.0 发布文及价格图片](https://developers.googleblog.com/en/gemini-2-family-expands/)：Flash 文本输入/输出为 $0.10/$0.40，Flash-Lite 为 $0.075/$0.30，单位为百万 token；不使用音频、缓存档。
- [Flash-Lite 稳定版发布文](https://developers.googleblog.com/en/gemini-25-flash-lite-is-now-stable-and-generally-available/)：Gemini 2.5 Flash-Lite 的稳定版发布价为 $0.10/$0.40，正式可用日期为 2025-07-22。Gemini 2.0 Flash-Lite 的正式可用日期 2025-02-25 来自 Gemini API 发布记录。
- [Gemini 2.5 更新公告](https://developers.googleblog.com/gemini-2-5-thinking-model-updates/)：2025-06-17 稳定版 Flash 为 $0.30/$2.50。由于早期预览版按思考模式分档，本次只补一条带日期的 `price_history`，不将稳定版价格伪装成早期预览发布价。

仍未增加同条件基准组，也未推断缺失的前代、参数或行业覆盖率。相同表格不等于相同评测配置。
