# 来源检查复核（2026-09-27）

[GitHub Actions 来源检查](https://github.com/majiayu000/model-chronicle/actions/runs/36287145807)检查了 258 个去重来源：232 个可达、26 个在自动请求中返回 HTTP 403、没有 404/410。下列 26 个均来自 `openai.com`；同日通过网页读取可取得对应 OpenAI 页面内容。403 在这里表示自动访问受限，不能据此删除来源或判定链接已失效。

这次复核仅确认页面可读取，不代表逐条字段内容已核实；模型记录的 `verified_at` 因此不批量改动。后续来源检查会将 401/403/429 单列为“站点拒绝/限流”，与 404/410 和网络错误分开。

## 自动访问受限的页面

- [api-prompt-caching](https://openai.com/index/api-prompt-caching/)
- [gpt-4-1](https://openai.com/index/gpt-4-1/)
- [gpt-4-research](https://openai.com/index/gpt-4-research/)
- [gpt-4o-mini-advancing-cost-efficient-intelligence](https://openai.com/index/gpt-4o-mini-advancing-cost-efficient-intelligence/)
- [gpt-5-3-instant](https://openai.com/index/gpt-5-3-instant/)
- [gpt-5-5-instant](https://openai.com/index/gpt-5-5-instant/)
- [gpt-5-6](https://openai.com/index/gpt-5-6/)
- [gpt-5-system-card-addendum-gpt-5-1](https://openai.com/index/gpt-5-system-card-addendum-gpt-5-1/)
- [gpt-6-astra](https://openai.com/index/gpt-6-astra/)
- [hello-gpt-4o](https://openai.com/index/hello-gpt-4o/)
- [introducing-chatgpt-and-whisper-apis](https://openai.com/index/introducing-chatgpt-and-whisper-apis/)
- [introducing-chatgpt-pro](https://openai.com/index/introducing-chatgpt-pro/)
- [introducing-gpt-4-5](https://openai.com/index/introducing-gpt-4-5/)
- [introducing-gpt-5-2](https://openai.com/index/introducing-gpt-5-2/)
- [introducing-gpt-5-4-mini-and-nano](https://openai.com/index/introducing-gpt-5-4-mini-and-nano/)
- [introducing-gpt-5-4](https://openai.com/index/introducing-gpt-5-4/)
- [introducing-gpt-5-5](https://openai.com/index/introducing-gpt-5-5/)
- [introducing-gpt-5-for-developers](https://openai.com/index/introducing-gpt-5-for-developers/)
- [introducing-gpt-6-sol-and-luna](https://openai.com/index/introducing-gpt-6-sol-and-luna/)
- [introducing-gpt-oss](https://openai.com/index/introducing-gpt-oss/)
- [introducing-o3-and-o4-mini](https://openai.com/index/introducing-o3-and-o4-mini/)
- [introducing-openai-o1-preview](https://openai.com/index/introducing-openai-o1-preview/)
- [new-models-and-developer-products-announced-at-devday](https://openai.com/index/new-models-and-developer-products-announced-at-devday/)
- [o1-and-new-tools-for-developers](https://openai.com/index/o1-and-new-tools-for-developers/)
- [openai-o1-mini-advancing-cost-efficient-reasoning](https://openai.com/index/openai-o1-mini-advancing-cost-efficient-reasoning/)
- [openai-o3-mini](https://openai.com/index/openai-o3-mini/)
