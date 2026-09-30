# 模型编年史（Model Chronicle）

记录主流大模型从诞生到被下一代接替的时间线：每个模型的能力、规格，以及同档位两代模型之间的发布间隔。

## 使用

```bash
bun install
bun run dev        # 校验数据、生成独立页面并启动开发服务器
bun run build      # 校验数据 + 生成独立页面 + 类型检查 + 生产构建
bun run test       # 单元测试
bun run format:check # 检查应用模板和视图源码格式
bun run audit:sources --limit=10  # 抽查 10 个来源；完整检查省略 --limit
```

## 收录数据

每个模型一个 YAML：`data/models/<vendor>/<id>.yaml`，字段说明见 [docs/DATA_SCHEMA.md](docs/DATA_SCHEMA.md)。
本次收录数量、字段覆盖和剩余边界见 [docs/COLLECTION_STATUS.md](docs/COLLECTION_STATUS.md)。
`bun run data` 会校验全部文件（schema、predecessor 是否存在且同线、时间先后、文件名与 id 一致），失败时构建直接中止。
新增或修正记录的步骤见 [CONTRIBUTING.md](CONTRIBUTING.md)；PR 会自动运行构建和测试。

首页使用 `Chronicle Graph v2` 导出稿。页面结构在 `index.html`，视图逻辑与运行时在 `public/graph-v2/`。`src/design/bootstrap.ts` 只将通过校验的 YAML 模型数据接入页面；未入库的模型不参与统计。导出稿指定的 React 18 已保存在 `public/graph-v2/vendor/`，避免运行时版本差异。

状态与事件处理在 `src/design/application.js`，维护入口和第三方运行时边界见 [前端维护说明](docs/FRONTEND_MAINTENANCE.md)。

构建时还会生成 `public/dataset/` 下的 JSON、CSV、字段覆盖和待复核清单，随网站一起发布。来源链接检查每周运行一次，生成可下载的 Actions 报告；不可访问只进入人工复核，不会自动改写 YAML。
构建还会在 `public/model/` 生成每个模型的独立 HTML 页面、[模型索引](https://majiayu000.github.io/model-chronicle/model/)和[站点地图](https://majiayu000.github.io/model-chronicle/sitemap.xml)。这些目录是构建产物，不应手改；所有页面沿用 YAML 的缺失值和来源。

## 在线访问与部署

[打开模型编年史](https://majiayu000.github.io/model-chronicle/)

推送到 `main` 后，GitHub Actions 使用 Bun 1.3.11 安装锁定依赖，完成数据校验、类型检查、构建和测试，再将 `dist/` 发布到 GitHub Pages。仓库 Pages 的 Source 使用 GitHub Actions。

部署地址统一来自 `site.config.json`，也可用 `SITE_URL=https://example.com/catalog/ bun run build` 覆盖；首页 canonical、结构化数据、分享标签、模型页、sitemap 和 robots.txt 使用同一地址。迁移域名或子路径时无需改构建脚本。`robots.txt` 只有部署在域名根路径才会被爬虫自动读取；GitHub Pages 项目子路径下的文件需由根站点配置引用，不能宣称项目文件已控制整个域名的抓取。

支持 ⌘K / Ctrl+K 搜索、最多四个模型并排对比，以及 1–7 切换视图。视图、模型、筛选和对比选择可复制链接分享。对比中的基准高亮只使用已核实的同条件对照组，并可切换已核实的组；价格图使用发布时定价，模型详情中的有来源历史观测单独展示。

时间轴默认聚焦最近 12 个日历月，按“厂商 → 系列 → 版本 → 具体型号”展示。GPT 系列只占一行，mini、nano、Pro 等在对应版本内展开；档位只是型号属性。可切换全部历史、展开早期型号，或通过厂商单选与“只看这家”聚焦。每个具体型号、版本和系列左侧都有隐藏入口，支持撤销、逐个恢复和全部恢复。隐藏设置只保存在本机浏览器，刷新保留，不写入分享链接，不影响搜索、详情、其他分析视图与数据下载。卡片和覆盖率跟随时间轴内的可见型号；热图默认展示全部已收录年份，按月统计至当前月份，并保留厂商、能力与隐藏筛选。[行为约定与验收](docs/TIMELINE_FOCUS_SPEC.md)。

## 资料入口与工具

首页“资料与工具”链接进入 `model/explore.html`。构建根据现有 YAML 生成厂商页、系列演进页、六组精选代际对比、百万上下文专题、数据口径说明和生命周期索引。型号页展示关键变化、前后代与同版本型号、规格差异、引用复制和预填纠错链接。纠错链接只打开草稿，不自动创建 Issue；仓库地址来自 `site.config.json` 的 `repository`。

- `model/finder.html`：按型号/中文厂商、输入模态、最低上下文、开放权重和日期组合筛选；可分享筛选链接并导出结果 CSV。月份精度按日期范围重叠处理。
- `model/calculator.html`：按每次输入/输出 token 与请求次数，用明确选定的发布价或历史观测试算美元费用；用量和价格选择保存在链接中。结果不代表当前报价，不包含缓存、阶梯、长上下文等特殊计费。
- 交互搜索忽略常见空格、连字符和点号差异，精确匹配优先，可查看全部结果；支持上下键选择、Enter 打开、Ctrl/Cmd+Enter 加入对比、Escape 关闭和弹窗内 Tab 循环。
- 交互对比默认展示已核实的同条件组，支持“只看差异”和所选型号 CSV。能力成本图的分数门槛随链接还原。编程筛选说明其收录依据；缺少开放权重/闭源任一侧的同组样本时，追赶图显示资料不足，不计算等待时间。
- `model/recent.html`、`releases.xml`、`updates.xml` 分别提供最近 30 天发布、发布 RSS 和记录复核 RSS。复核不等于新发布或首次收录；RSS 不把只有月份的记录编造成具体日期。

静态页面、近期窗口、生命周期倒计时和 RSS 在每次构建时刷新；数据修改后需重新构建部署。RSS 不会自主查询厂商新发布。`public/model/`、两份 RSS 与 sitemap 均为生成产物。全站默认分享图为 `public/social-card.png`（1200 × 630）。首页在脚本加载前就提供可见资料与链接，交互初始化成功后收起，完整资料通过导航中的“资料与工具”访问；运行时脚本并行预加载、按依赖顺序执行。

## SEO 上线验收

1. 部署后抽查首页、厂商页、型号页及 `sitemap.xml` 的 HTTP 状态、canonical、分享图和相对链接；新 sitemap 同时包含专题页。
2. 由站点所有者在 Google Search Console 验证 `site.config.json` 指定的 URL 前缀属性，并提交站点根目录下的 `sitemap.xml`。仓库无法替代账号验证，也无法从构建成功推断实际收录或排名。
3. 使用 URL 检查抽查首页、一个型号页和一个厂商页；记录收录状态及 Google 读取的页面。查看搜索效果中的查询、页面、曝光与点击后，再决定补哪些专题。
4. 本地浏览器检查与真实用户性能数据分开记录；本地耗时不作为线上 Core Web Vitals 或排名收益的证明。

## 许可

本项目原创代码与文档采用 [MIT 许可](LICENSE)；整理的模型记录及其 JSON/CSV 导出采用 [CC BY 4.0 数据许可](data/LICENSE.md)。再利用数据时请署名 Model Chronicle（majiayu000）、链接原项目及许可，并注明修改。第三方运行文件保留各自权利，边界见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
