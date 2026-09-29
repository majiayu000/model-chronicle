# 厂商与型号缺漏核查（2026-09-30）

本轮从 19 家 / 233 条扩展到 28 家 / 316 条，新增 83 条。四家已指出的整家遗漏均已补入；另外新增百川、零一万物、书生浦语、TII 和 Liquid AI。此文记录本轮实际核实的范围，不宣称全球厂商或任一厂商的全部历史型号已穷尽。

## 已完成的补录

| 厂商 | 新增 | 已核实并收录的范围 |
|---|---:|---|
| 阶跃星辰 / StepFun | 4 | Step3、3.5 Flash、3.7 Flash、5 Preview |
| 讯飞星火 | 11 | 星火 V1.0 / 1.5 / 2.0 / 3.0 / 3.5 / 4.0、X1 / X1.5 / X2 / X2 Flash / X2 VL |
| AI21 | 11 | Jurassic-2 三种尺寸、Jamba / Instruct / 1.5 / 1.6 / 2 |
| Ai2 | 14 | OLMo 1 / 2、OLMoE、Olmo 3 / 3.1、Olmo Hybrid |
| 零一万物 / Yi | 10 | Yi 基座 / Chat / VL、Yi-1.5 Chat 三种尺寸 |
| 书生浦语 / InternLM | 7 | InternLM 20B、2 / 2.5 的已核实尺寸、3 8B |
| 百川智能 | 3 | Baichuan2 7B / 13B Chat 与 13B Chat v2 |
| TII / Falcon | 4 | Falcon3 1B / 3B / 7B / 10B Instruct |
| Liquid AI | 7 | LFM2 三种尺寸、VL 3B、LFM2.5 Instruct / VL / Thinking |
| Z.ai / GLM | 2 | GLM-5、GLM-5.1，接回 5.2 继任链 |
| Kimi / Moonshot | 1 | Kimi K2 Thinking |
| Qwen | 5 | Qwen3 0.6B / 1.7B / 4B / 8B / 14B |
| Mistral | 1 | Mixtral 8x22B Instruct |
| Cohere | 1 | Command R7B |
| Microsoft Phi | 2 | Phi-4-mini-instruct、Phi-4-multimodal-instruct |

## 口径与未补值原因

- 日期采用官方发布文、官方仓库发布记录、官方模型卡和公司披露文件。只确认月份的保留 `YYYY-MM`；网页更新时间不视为首发日。
- Step 3.5 Flash 官方博客仅标注 2026-02-12 updated；`announced` 留空，`ga` 采用 Vercel 分发平台记录的 2026-01-29。此值是分发平台的可用记录，不是已核实的厂商首发声明。
- Step 5 Preview 的 2026-09-20 采用 Vercel 的 StepFun 提供商发布记录，官方文档确认模型、1M 上下文、64K 输出和图文视频输入；官方产品页确认 600B 总参数、27B 激活的稀疏 MoE。`ga` 留空，仍为预览；截至核查日，官方首页仍预告未来公开权重，所以 `open_weights: false`。不采用第三方上传的所谓权重作为厂商公开证据。
- GLM-5 的官方 API 日志日期为 2026-02-12，记录为 `ga`；本轮未取得首发博客的可读正文，`announced` 留空。GLM-5.1 的日志日期为 2026-04-07。
- 星火 X2 / X2 Flash / X2 VL 的月份依据科大讯飞 2026 半年度报告正文第 10 页；只对明确同步开放 API 的 Flash 填写 GA，其余不从“发布”自动推导公众可用日期。未将 X2-300B 的升级日期冒充整个 X2 系列首发日。
- InternLM2.5 1.8B / 20B 的新闻栏写 8 月 1 日，模型表写 8 月 5 日，因此只记 2024-08。InternLM2 1.8B 的发布记录存在跨月份口径差异，暂未补入。
- Olmo 3.1 日期来自原发布文顶部的 12/12 更新，不沿用 Olmo 3 的 11 月 20 日。OLMo 1B 另由原始论文确认，不能只依赖写明 7B 的博客。
- Baichuan2 的 2023-09-06 发布记录来自官方 Baichuan-7B 仓库；上下文长度由各型号官方配置确认。Chat v2 采用官方明确列出的独立更新版本。
- 混合 SSM / RNN / 卷积架构不强行填入只支持 Dense / MoE 的结构字段；相关事实保留在简述中。
- 档位属于本库编辑分类，不代表厂商官方名称或跨厂商能力排名。未核实价格、知识截止、输出上限及基准的字段保持空值；不拿当前促销价当发布价。

## 尚未完成的覆盖核查

下面是已识别的待核查范围，并非完整行业缺漏清单。保留这些范围，是为了避免“厂商已出现”被误读为“其型号已全部补齐”。

| 范围 | 当前状态 / 下一步依据 |
|---|---|
| StepFun 早期 Step-1 / 1V / 2 / 1.5V 与其他文本变体 | 尚需可追溯的官方发布日；当前官方首页偏向新型号，未根据二手年表直接补日期。 |
| 讯飞 Lite / Pro / Max / Ultra 等 API 名称 | 需核实这些服务别名与 V / X 系列的对应关系，避免同模型重复收录。 |
| AI21 Jurassic-2 Instruct 与后续 API 改名 | 需区分新权重、服务名称和尺寸别名；本轮只收明确独立型号。 |
| Ai2 Tülu / Molmo 系列 | 本轮核查 Olmo 家族，其他家族尚未完成逐型号历史核查。 |
| Yi 长上下文变体、闭源 API 系列 | 本轮已核实基础与 Chat / VL 主干；长上下文和 API 系列待逐条确认。 |
| InternLM 早期 7B / 1.8B、百川首代及闭源系列 | 本轮仅补日期与名称能核实的版本。 |
| Falcon 1 / 2 / H1、Liquid 其他尺寸 | 本轮建立 Falcon3 和 LFM2 / 2.5 主干，其他版本待复核。 |
| 其他尚未收录厂商 | 商汤、华为、小米、Databricks、Reka 等仍需按通用语言模型范围核查；本轮未将检索到的名字直接当作已验证记录。 |
| 原有 19 家厂商的全部历史 | GLM、Kimi、Qwen、Mistral、Cohere、Phi 本轮定点补漏；其余原记录未逐字段重新审计。旧版依据仍见 YAML、COLLECTION_STATUS 和 DATA_REVIEW_2026-09-27。 |

## 新增记录与来源

每条 YAML 保存完整来源；下表的日期优先列 GA，GA 不明则列宣布日期。月份精度不补成虚构的具体日。

| 模型 | 时间轴日期 | 口径 | 来源与数据 |
|---|---|---|
| Yi-34B | 2023-11-02 | 可用 | [来源](https://github.com/01-ai/Yi) · [YAML](../data/models/01ai/yi-34b.yaml) |
| Yi-6B | 2023-11-02 | 可用 | [来源](https://github.com/01-ai/Yi) · [YAML](../data/models/01ai/yi-6b.yaml) |
| Yi-34B-Chat | 2023-11-23 | 可用 | [来源](https://github.com/01-ai/Yi) · [YAML](../data/models/01ai/yi-34b-chat.yaml) |
| Yi-6B-Chat | 2023-11-23 | 可用 | [来源](https://github.com/01-ai/Yi) · [YAML](../data/models/01ai/yi-6b-chat.yaml) |
| Yi-VL-34B | 2024-01-23 | 可用 | [来源](https://github.com/01-ai/Yi) · [YAML](../data/models/01ai/yi-vl-34b.yaml) |
| Yi-VL-6B | 2024-01-23 | 可用 | [来源](https://github.com/01-ai/Yi) · [YAML](../data/models/01ai/yi-vl-6b.yaml) |
| Yi-9B | 2024-03-06 | 可用 | [来源](https://github.com/01-ai/Yi) · [YAML](../data/models/01ai/yi-9b.yaml) |
| Yi-1.5-34B-Chat | 2024-05-13 | 可用 | [来源](https://github.com/01-ai/Yi-1.5) · [YAML](../data/models/01ai/yi-1-5-34b-chat.yaml) |
| Yi-1.5-6B-Chat | 2024-05-13 | 可用 | [来源](https://github.com/01-ai/Yi-1.5) · [YAML](../data/models/01ai/yi-1-5-6b-chat.yaml) |
| Yi-1.5-9B-Chat | 2024-05-13 | 可用 | [来源](https://github.com/01-ai/Yi-1.5) · [YAML](../data/models/01ai/yi-1-5-9b-chat.yaml) |
| Jurassic-2 Grande | 2023-03-09 | 可用 | [来源](https://www.ai21.com/blog/introducing-j2/) · [YAML](../data/models/ai21/jurassic-2-grande.yaml) |
| Jurassic-2 Jumbo | 2023-03-09 | 可用 | [来源](https://www.ai21.com/blog/introducing-j2/) · [YAML](../data/models/ai21/jurassic-2-jumbo.yaml) |
| Jurassic-2 Large | 2023-03-09 | 可用 | [来源](https://www.ai21.com/blog/introducing-j2/) · [YAML](../data/models/ai21/jurassic-2-large.yaml) |
| Jamba | 2024-03-28 | 可用 | [来源](https://www.ai21.com/blog/announcing-jamba/) · [YAML](../data/models/ai21/jamba.yaml) |
| Jamba-Instruct | 2024-05-02 | 宣布 | [来源](https://www.ai21.com/blog/announcing-jamba-instruct/) · [YAML](../data/models/ai21/jamba-instruct.yaml) |
| Jamba 1.5 Large | 2024-08-22 | 可用 | [来源](https://www.ai21.com/blog/announcing-jamba-model-family/) · [YAML](../data/models/ai21/jamba-1-5-large.yaml) |
| Jamba 1.5 Mini | 2024-08-22 | 可用 | [来源](https://www.ai21.com/blog/announcing-jamba-model-family/) · [YAML](../data/models/ai21/jamba-1-5-mini.yaml) |
| Jamba 1.6 Large | 2025-03-06 | 可用 | [来源](https://www.ai21.com/blog/introducing-jamba-1-6/) · [YAML](../data/models/ai21/jamba-1-6-large.yaml) |
| Jamba 1.6 Mini | 2025-03-06 | 可用 | [来源](https://www.ai21.com/blog/introducing-jamba-1-6/) · [YAML](../data/models/ai21/jamba-1-6-mini.yaml) |
| Jamba2 3B | 2026-01-08 | 可用 | [来源](https://www.ai21.com/blog/introducing-jamba2/) · [YAML](../data/models/ai21/jamba-2-3b.yaml) |
| Jamba2 Mini | 2026-01-08 | 可用 | [来源](https://www.ai21.com/blog/introducing-jamba2/) · [YAML](../data/models/ai21/jamba-2-mini.yaml) |
| OLMo 1B | 2024-02-01 | 可用 | [来源](https://allenai.org/blog/hello-olmo-a-truly-open-llm-43f7e7359222) · [YAML](../data/models/allenai/olmo-1b.yaml) |
| OLMo 7B | 2024-02-01 | 可用 | [来源](https://allenai.org/blog/hello-olmo-a-truly-open-llm-43f7e7359222) · [YAML](../data/models/allenai/olmo-7b.yaml) |
| OLMoE 1B-7B Instruct | 2024-09-04 | 可用 | [来源](https://allenai.org/blog/olmoe-an-open-small-and-state-of-the-art-mixture-of-experts-model-c258432d0514) · [YAML](../data/models/allenai/olmoe-1b-7b-instruct.yaml) |
| OLMo 2 13B Instruct | 2024-11-26 | 可用 | [来源](https://allenai.org/blog/olmo2) · [YAML](../data/models/allenai/olmo-2-13b-instruct.yaml) |
| OLMo 2 7B Instruct | 2024-11-26 | 可用 | [来源](https://allenai.org/blog/olmo2) · [YAML](../data/models/allenai/olmo-2-7b-instruct.yaml) |
| OLMo 2 32B Instruct | 2025-03-13 | 可用 | [来源](https://allenai.org/blog/olmo2-32B) · [YAML](../data/models/allenai/olmo-2-32b-instruct.yaml) |
| Olmo 3 32B Base | 2025-11-20 | 可用 | [来源](https://allenai.org/blog/olmo3) · [YAML](../data/models/allenai/olmo-3-32b-base.yaml) |
| Olmo 3 32B Think | 2025-11-20 | 可用 | [来源](https://allenai.org/blog/olmo3) · [YAML](../data/models/allenai/olmo-3-32b-think.yaml) |
| Olmo 3 7B Base | 2025-11-20 | 可用 | [来源](https://allenai.org/blog/olmo3) · [YAML](../data/models/allenai/olmo-3-7b-base.yaml) |
| Olmo 3 7B Instruct | 2025-11-20 | 可用 | [来源](https://allenai.org/blog/olmo3) · [YAML](../data/models/allenai/olmo-3-7b-instruct.yaml) |
| Olmo 3 7B Think | 2025-11-20 | 可用 | [来源](https://allenai.org/blog/olmo3) · [YAML](../data/models/allenai/olmo-3-7b-think.yaml) |
| Olmo 3.1 32B Instruct | 2025-12-12 | 可用 | [来源](https://allenai.org/blog/olmo3) · [YAML](../data/models/allenai/olmo-3-1-32b-instruct.yaml) |
| Olmo 3.1 32B Think | 2025-12-12 | 可用 | [来源](https://allenai.org/blog/olmo3) · [YAML](../data/models/allenai/olmo-3-1-32b-think.yaml) |
| Olmo Hybrid 7B | 2026-03-05 | 可用 | [来源](https://allenai.org/blog/olmohybrid) · [YAML](../data/models/allenai/olmo-hybrid-7b.yaml) |
| Baichuan2-13B-Chat | 2023-09-06 | 可用 | [来源](https://github.com/baichuan-inc/Baichuan-7B) · [YAML](../data/models/baichuan/baichuan-2-13b-chat.yaml) |
| Baichuan2-7B-Chat | 2023-09-06 | 可用 | [来源](https://github.com/baichuan-inc/Baichuan-7B) · [YAML](../data/models/baichuan/baichuan-2-7b-chat.yaml) |
| Baichuan2-13B-Chat v2 | 2023-12-29 | 可用 | [来源](https://github.com/baichuan-inc/Baichuan2) · [YAML](../data/models/baichuan/baichuan-2-13b-chat-v2.yaml) |
| Command R7B | 2024-12-13 | 可用 | [来源](https://docs.cohere.com/changelog/command-r-7b) · [YAML](../data/models/cohere/command-r7b.yaml) |
| 讯飞星火 V1.0 | 2023-05-06 | 宣布 | [来源](https://edu.iflytek.com/about-us/news/company-news/83.html) · [YAML](../data/models/iflytek/spark-1-0.yaml) |
| 讯飞星火 V1.5 | 2023-06-09 | 可用 | [来源](https://edu.iflytek.com/about-us/news/company-news/793) · [YAML](../data/models/iflytek/spark-1-5.yaml) |
| 讯飞星火 V2.0 | 2023-08-15 | 宣布 | [来源](https://edu.iflytek.com/about-us/news/company-news/791) · [YAML](../data/models/iflytek/spark-2-0.yaml) |
| 讯飞星火 V3.0 | 2023-10-24 | 宣布 | [来源](https://edu.iflytek.com/about-us/news/company-news/789.html) · [YAML](../data/models/iflytek/spark-3-0.yaml) |
| 讯飞星火 V3.5 | 2024-01-30 | 可用 | [来源](https://edu.iflytek.com/about-us/news/company-news/673.html) · [YAML](../data/models/iflytek/spark-3-5.yaml) |
| 讯飞星火 V4.0 | 2024-06-27 | 宣布 | [来源](https://edu.iflytek.com/about-us/news/company-news/1095) · [YAML](../data/models/iflytek/spark-4-0.yaml) |
| 讯飞星火 X1 | 2025-01-15 | 宣布 | [来源](https://www.xunfeihealthcare.com/cht/news/181/794.html) · [YAML](../data/models/iflytek/spark-x1.yaml) |
| 讯飞星火 X1.5 | 2025-11-06 | 宣布 | [来源](https://edu.iflytek.com/about-us/news/company-news/2535) · [YAML](../data/models/iflytek/spark-x1-5.yaml) |
| 讯飞星火 X2 | 2026-02 | 宣布 | [来源](https://static.cninfo.com.cn/finalpage/2026-08-21/1225485550.PDF) · [YAML](../data/models/iflytek/spark-x2.yaml) |
| 讯飞星火 X2 Flash | 2026-04 | 可用 | [来源](https://static.cninfo.com.cn/finalpage/2026-08-21/1225485550.PDF) · [YAML](../data/models/iflytek/spark-x2-flash.yaml) |
| 讯飞星火 X2 VL | 2026-06 | 宣布 | [来源](https://static.cninfo.com.cn/finalpage/2026-08-21/1225485550.PDF) · [YAML](../data/models/iflytek/spark-x2-vl.yaml) |
| InternLM-20B-Chat | 2023-09-20 | 可用 | [来源](https://github.com/InternLM/InternLM) · [YAML](../data/models/internlm/internlm-20b-chat.yaml) |
| InternLM2-20B-Chat | 2024-01-17 | 可用 | [来源](https://github.com/InternLM/InternLM) · [YAML](../data/models/internlm/internlm-2-20b-chat.yaml) |
| InternLM2-7B-Chat | 2024-01-17 | 可用 | [来源](https://github.com/InternLM/InternLM) · [YAML](../data/models/internlm/internlm-2-7b-chat.yaml) |
| InternLM2.5-7B-Chat | 2024-07-03 | 可用 | [来源](https://github.com/InternLM/InternLM) · [YAML](../data/models/internlm/internlm-2-5-7b-chat.yaml) |
| InternLM2.5-1.8B-Chat | 2024-08 | 可用 | [来源](https://github.com/InternLM/InternLM) · [YAML](../data/models/internlm/internlm-2-5-1-8b-chat.yaml) |
| InternLM2.5-20B-Chat | 2024-08 | 可用 | [来源](https://github.com/InternLM/InternLM) · [YAML](../data/models/internlm/internlm-2-5-20b-chat.yaml) |
| InternLM3-8B-Instruct | 2025-01-15 | 可用 | [来源](https://github.com/InternLM/InternLM) · [YAML](../data/models/internlm/internlm-3-8b-instruct.yaml) |
| LFM2-1.2B | 2025-07-10 | 可用 | [来源](https://www.liquid.ai/blog/liquid-foundation-models-v2-our-second-series-of-generative-ai-models) · [YAML](../data/models/liquid/lfm-2-1-2b.yaml) |
| LFM2-350M | 2025-07-10 | 可用 | [来源](https://www.liquid.ai/blog/liquid-foundation-models-v2-our-second-series-of-generative-ai-models) · [YAML](../data/models/liquid/lfm-2-350m.yaml) |
| LFM2-700M | 2025-07-10 | 可用 | [来源](https://www.liquid.ai/blog/liquid-foundation-models-v2-our-second-series-of-generative-ai-models) · [YAML](../data/models/liquid/lfm-2-700m.yaml) |
| LFM2-VL-3B | 2025-10-22 | 可用 | [来源](https://www.liquid.ai/blog/lfm2-vl-3b-a-new-efficient-vision-language-for-the-edge) · [YAML](../data/models/liquid/lfm-2-vl-3b.yaml) |
| LFM2.5-1.2B-Instruct | 2026-01-05 | 可用 | [来源](https://www.liquid.ai/blog/introducing-lfm2-5-the-next-generation-of-on-device-ai) · [YAML](../data/models/liquid/lfm-2-5-1-2b-instruct.yaml) |
| LFM2.5-VL-1.6B | 2026-01-05 | 可用 | [来源](https://www.liquid.ai/blog/introducing-lfm2-5-the-next-generation-of-on-device-ai) · [YAML](../data/models/liquid/lfm-2-5-vl-1-6b.yaml) |
| LFM2.5-1.2B-Thinking | 2026-01-20 | 可用 | [来源](https://www.liquid.ai/blog/lfm2-5-1-2b-thinking-on-device-reasoning-under-1gb) · [YAML](../data/models/liquid/lfm-2-5-1-2b-thinking.yaml) |
| Phi-4-mini-instruct | 2025-02-26 | 可用 | [来源](https://azure.microsoft.com/en-us/blog/empowering-innovation-the-next-generation-of-the-phi-family/) · [YAML](../data/models/microsoft/phi-4-mini-instruct.yaml) |
| Phi-4-multimodal-instruct | 2025-02-26 | 可用 | [来源](https://azure.microsoft.com/en-us/blog/empowering-innovation-the-next-generation-of-the-phi-family/) · [YAML](../data/models/microsoft/phi-4-multimodal-instruct.yaml) |
| Mixtral 8x22B Instruct | 2024-04-17 | 可用 | [来源](https://mistral.ai/news/mixtral-8x22b) · [YAML](../data/models/mistral/mixtral-8x22b-instruct.yaml) |
| Kimi K2 Thinking | 2025-11-06 | 可用 | [来源](https://www.kimi.com/en/blog/) · [YAML](../data/models/moonshot/kimi-k2-thinking.yaml) |
| Qwen3-0.6B | 2025-04-29 | 可用 | [来源](https://qwenlm.github.io/blog/qwen3/) · [YAML](../data/models/qwen/qwen3-0-6b.yaml) |
| Qwen3-1.7B | 2025-04-29 | 可用 | [来源](https://qwenlm.github.io/blog/qwen3/) · [YAML](../data/models/qwen/qwen3-1-7b.yaml) |
| Qwen3-14B | 2025-04-29 | 可用 | [来源](https://qwenlm.github.io/blog/qwen3/) · [YAML](../data/models/qwen/qwen3-14b.yaml) |
| Qwen3-4B | 2025-04-29 | 可用 | [来源](https://qwenlm.github.io/blog/qwen3/) · [YAML](../data/models/qwen/qwen3-4b.yaml) |
| Qwen3-8B | 2025-04-29 | 可用 | [来源](https://qwenlm.github.io/blog/qwen3/) · [YAML](../data/models/qwen/qwen3-8b.yaml) |
| Step3 | 2025-07-31 | 可用 | [来源](https://chat.stepfun.com/research/en/step3) · [YAML](../data/models/stepfun/step-3.yaml) |
| Step 3.5 Flash | 2026-01-29 | 可用 | [来源](https://vercel.com/ai-gateway/models/step-3.5-flash) · [YAML](../data/models/stepfun/step-3-5-flash.yaml) |
| Step 3.7 Flash | 2026-05-29 | 可用 | [来源](https://static.stepfun.com/blog/step-3.7-flash/) · [YAML](../data/models/stepfun/step-3-7-flash.yaml) |
| Step 5 Preview | 2026-09-20 | 宣布 | [来源](https://www.stepfun.com/step-5-preview) · [YAML](../data/models/stepfun/step-5-preview.yaml) |
| Falcon3-10B-Instruct | 2024-12-17 | 可用 | [来源](https://www.tii.ae/news/falcon-3-uaes-technology-innovation-institute-launches-worlds-most-powerful-small-ai-models) · [YAML](../data/models/tii/falcon-3-10b-instruct.yaml) |
| Falcon3-1B-Instruct | 2024-12-17 | 可用 | [来源](https://www.tii.ae/news/falcon-3-uaes-technology-innovation-institute-launches-worlds-most-powerful-small-ai-models) · [YAML](../data/models/tii/falcon-3-1b-instruct.yaml) |
| Falcon3-3B-Instruct | 2024-12-17 | 可用 | [来源](https://www.tii.ae/news/falcon-3-uaes-technology-innovation-institute-launches-worlds-most-powerful-small-ai-models) · [YAML](../data/models/tii/falcon-3-3b-instruct.yaml) |
| Falcon3-7B-Instruct | 2024-12-17 | 可用 | [来源](https://www.tii.ae/news/falcon-3-uaes-technology-innovation-institute-launches-worlds-most-powerful-small-ai-models) · [YAML](../data/models/tii/falcon-3-7b-instruct.yaml) |
| GLM-5 | 2026-02-12 | 可用 | [来源](https://docs.z.ai/release-notes/new-released) · [YAML](../data/models/zhipu/glm-5.yaml) |
| GLM-5.1 | 2026-04-07 | 可用 | [来源](https://docs.z.ai/release-notes/new-released) · [YAML](../data/models/zhipu/glm-5-1.yaml) |

## 页面与构建验收

- `bun run build`、`bun run test:unit`（12 个文件、89 项测试）、`bun run format:check` 与 `git diff --check` 均通过。构建生成全部 316 条模型的 JSON、CSV、独立详情页和站点地图。
- 时间轴的全部历史及最近一年分组检查保证每条记录恰好出现一次；厂商筛选包含新增 9 家。
- GPT-6 版本节点点击展开 Astra / Luna / Sol 三个带连接线的子节点，再次点击收起；子节点保留悬停与详情入口。
- 新数据沿用同一交互，早于默认一年窗口的版本由“全部历史”或早期型号入口展示。
- 构建和单元测试用于验证结构、日期关系、页面行为，不能证明行业收录齐全；来源 HTTP 检查也只证明当次访问情况。
- 本轮批量读取 51 个原始来源 URL，38 个直接返回 200；讯飞教育站出现 TLS 握手限制，AI21 博客对直接请求返回 403。正文已通过网页检索工具读取核对，不把这些访问限制报告成失效来源。
