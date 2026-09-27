# 模型编年史（Model Chronicle）

记录主流大模型从诞生到被下一代接替的时间线：每个模型的能力、规格，以及同档位两代模型之间的发布间隔。

## 使用

```bash
bun install
bun run dev        # 校验 data/ 并启动开发服务器
bun run build      # 校验数据 + 类型检查 + 生产构建
bun run test       # 单元测试
bun run audit:sources --limit=10  # 抽查 10 个来源；完整检查省略 --limit
```

## 收录数据

每个模型一个 YAML：`data/models/<vendor>/<id>.yaml`，字段说明见 [docs/DATA_SCHEMA.md](docs/DATA_SCHEMA.md)。
本次收录数量、字段覆盖和剩余边界见 [docs/COLLECTION_STATUS.md](docs/COLLECTION_STATUS.md)。
`bun run data` 会校验全部文件（schema、predecessor 是否存在且同线、时间先后、文件名与 id 一致），失败时构建直接中止。

首页使用 `Chronicle Graph v2` 导出稿。页面结构在 `index.html`，视图逻辑与运行时在 `public/graph-v2/`。`src/design/bootstrap.ts` 只将通过校验的 YAML 模型数据接入页面；未入库的模型不参与统计。导出稿指定的 React 18 已保存在 `public/graph-v2/vendor/`，避免运行时版本差异。

构建时还会生成 `public/dataset/` 下的 JSON、CSV、字段覆盖和待复核清单，随网站一起发布。来源链接检查每周运行一次，生成可下载的 Actions 报告；不可访问只进入人工复核，不会自动改写 YAML。

## 在线访问与部署

[打开模型编年史](https://majiayu000.github.io/model-chronicle/)

推送到 `main` 后，GitHub Actions 使用 Bun 1.3.11 安装锁定依赖，完成数据校验、类型检查、构建和测试，再将 `dist/` 发布到 GitHub Pages。仓库 Pages 的 Source 使用 GitHub Actions。

支持 ⌘K / Ctrl+K 搜索、最多四个模型并排对比，以及 1–7 切换视图。视图、模型、筛选和对比选择可复制链接分享。对比中的基准高亮只使用已核实的同条件对照组，并可切换已核实的组；价格图使用发布时定价，模型详情中的有来源历史观测单独展示。
