# 前端维护

## 编辑入口

- `index.html`：页面模板和样式；动态数据通过 `{{ … }}` 绑定。
- `src/design/application.js`：页面状态、键盘事件、路由同步与展示层组合。由 `bootstrap.ts` 以原文注入 `data-dc-script`，交给运行时编译。
- `public/graph-v2/chronicle.js`：模型适配、同条件基准规则。
- `chronicle-vm.js`：时间轴、详情、趋势与架构视图。
- `chronicle-timeline.js`：日历年窗口、系列与版本分组、旧链接迁移；不修改前后代关系。
- `chronicle-visibility.js`：个人隐藏 ID 的规范化、本地存储、隐藏与恢复；不修改数据或分享链接。
- `chronicle-ext.js`：开源追赶、能力成本与生命周期。
- `chronicle-ext2.js`：搜索和多模型对比。
- `chronicle-route.js`：可分享链接的解析与序列化。
- `price-chart.js`：价格图的 React/SVG 组件。SVG 数字属性不能直接放未解析的模板表达式，否则浏览器在运行时接管之前就会报错。

上述应用文件是仓库维护的源码。执行 `bun run format:ui` 格式化，`bun run format:check` 检查；固定 Prettier 版本，避免每次编辑生成大量样式差异。HTML 保持一个入口以兼容导出运行时；状态逻辑已从 HTML 拆出。

## 资料页与工具

- `scripts/build-pages.ts`：型号页、面包屑、引用、来源与 sitemap；`scripts/build-discovery.ts`：厂商/系列/专题/对比页及两份 RSS。
- `public/graph-v2/catalog-tools.js`：交互搜索与静态工具共用的检索、筛选、费用计算、选中模型 CSV。
- `public/graph-v2/catalog-page.js`：静态页的筛选、试算与引用复制，数据加载失败时保留原有静态目录。
- `vite.config.ts`：首页静态资料入口及元数据；`public/social-card.png`：默认分享图。

交互与静态工具的脚本链接都带内容指纹。静态工具的数据来自同次构建的 `dataset/models.json`；页面应明确显示数据加载失败，不能让旧试算结果假装有效。

## 导出运行时边界

`support.js` 与 `vendor/` 是第三方文件，格式化命令不包含它们。`support.js` 中提到的 `dc-runtime/src` 未随设计包提供，当前仓库不能重建这个运行时。不要把它当成可再生成的本地构建产物，也不要伪造上游源码。其来源及许可限制见 [第三方说明](../THIRD_PARTY_NOTICES.md)。升级时需取得新的完整导出包，比较行为后整体替换。

## 验证

运行 `bun run build`、`bun run test:unit`、`bun run format:check`。单独跑测试可用 `bun run test`，它会先生成所需数据与静态页；CI 在 build 后使用 test:unit，避免重复生成。

浏览器检查首页、搜索、对比、详情直达与刷新，以及手机宽度。价格图分别检查多条、单条与无观测数据；控制台区分页面错误、外部字体网络失败和浏览器扩展日志。不要仅凭 HTTP 200 判断界面通过。

本地隐藏验证应在结束后通过“全部恢复”清理测试偏好。脚本内容指纹由 Vite 构建生成并用于 bootstrap 的版本查询参数，浏览器更新时不会混用缓存中的旧模块。
