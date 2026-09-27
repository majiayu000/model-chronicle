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

时间轴默认聚焦最近 12 个日历月，可以切到“全部历史”。行内“前 N 代”展开窗口前的模型；每家厂商的“窗口外模型组”保留没有近期发布的历史记录。同厂商、同系列、同代的并行规格（如 Gemma 4）合在一个可展开的组中；其他没有已记录前后代关系的型号按厂商、档位并列显示，不新增继任连线。时间窗口栏右侧可单选厂商，厂商标题旁可点“只看这家”，并支持恢复全部、继续多选及分享链接恢复。卡片、热图和覆盖统计跟随窗口及筛选，搜索、详情、下载和其他视图继续使用完整目录。窗口与展开状态可随链接保存；最近窗口随查看日期移动。[行为约定与验收](docs/TIMELINE_FOCUS_SPEC.md)。

## 许可

本项目原创代码与文档采用 [MIT 许可](LICENSE)；整理的模型记录及其 JSON/CSV 导出采用 [CC BY 4.0 数据许可](data/LICENSE.md)。再利用数据时请署名 Model Chronicle（majiayu000）、链接原项目及许可，并注明修改。第三方运行文件保留各自权利，边界见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
