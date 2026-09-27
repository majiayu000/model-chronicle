# 参与模型编年史

欢迎修正模型数据、补充可核实记录和改进页面。每次提交尽量只处理一个模型或一项明确的页面行为，并在 PR 中写清来源和验证结果。

## 提交模型数据

1. 先在 `data/models/` 查找已有型号，避免把日期快照重复收录。收录范围和字段定义见 [数据 Schema](docs/DATA_SCHEMA.md)。
2. 新增记录放在 `data/models/<vendor>/<id>.yaml`；修改记录时保留已有可核实字段。日期只写来源支持的精度，缺失值填 `null`，不要从相近型号推断规格或价格。
3. 每条记录列出官方发布页、文档或模型卡。基准与架构各有自己的 `source`，且该链接也须列入顶层 `sources`。`comparison_group` 只有在基准版本、工具、推理设置和评测框架都一致时才能填写。
4. `specs.pricing` 是发布价。`price_history` 记录有日期和来源的标准文本 API 非缓存价，观测日期不等于调价生效日，也不能当作今天的价格。
5. 只在实际重新核对已填事实后更新 `verified_at`。来源链接可达并不能证明字段内容正确。

## 本地验证

```bash
bun install --frozen-lockfile
bun run build
bun run test
```

`bun run build` 校验全部 YAML、生成数据并检查类型。PR 会自动运行相同的构建和测试，但来源内容仍须人工审阅。需要检查链接时运行 `bun run audit:sources --limit=10` 抽查，或省略 `--limit` 检查全部来源；403 和超时只表示访问不确定。

页面运行在 GitHub Pages 的 `/model-chronicle/` 子路径。修改交互时请实际检查桌面和手机页面、键盘操作，以及复制链接后刷新能否恢复同一视图。
