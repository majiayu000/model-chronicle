# 模型编年史（Model Chronicle）

记录主流大模型从诞生到被下一代接替的时间线：每个模型的能力、规格，以及同档位两代模型之间的发布间隔。

## 使用

```bash
bun install
bun run dev        # 校验 data/ 并启动开发服务器
bun run build      # 校验数据 + 类型检查 + 生产构建
bun run test       # 单元测试
```

## 收录数据

每个模型一个 YAML：`data/models/<vendor>/<id>.yaml`，字段说明见 [docs/DATA_SCHEMA.md](docs/DATA_SCHEMA.md)。
`bun run data` 会校验全部文件（schema、predecessor 是否存在且同线、时间先后、文件名与 id 一致），失败时构建直接中止。
