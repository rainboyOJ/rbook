---
status: accepted
---

# 文章正文采用系统字体和局部排版 CSS

Rbook 的文章正文采用现代无衬线系统字体，代码采用系统等宽字体，并在 `.rbook-article .markdown-body` 范围内维护自己的排版变量和主题规则。正文基线固定为 `16px / 24px`、宽度 `42em`，代码块使用 `14px / 22px`；第一版不加载外部 Web Font、不引入 Heti 全量 CSS 或运行时混排脚本，以保持发布站点的首屏稳定性、插件边界和主题可控性。浅色与暗色主题分别使用匹配自身背景的语法高亮配色，旧规则先审计再收拢。

## Considered Options

- 使用外部中文 Web Font：视觉更一致，但增加资源体积、加载依赖和部署维护成本。
- 直接引入 Heti 全量 CSS：可以快速获得完整中文排版，但会与 Rbook 的 Markdown 插件、代码块和伪代码规则产生覆盖关系。
- 让正文和代码共享同一字号：实现简单，但会削弱正文与代码的层级，也不利于长代码阅读。

## Consequences

- 不同操作系统的中文字体字形会有轻微差异，需要在 fixture 中检查回退字体表现。
- 排版规则必须继续限定在文章正文范围内，不能把站点壳的导航和工具按钮纳入同一套规则。
- 如果将来需要自动中西文间距或标点挤压，应作为独立决策评估，而不是直接扩展第一版基础样式。

## 实施备注

- 排版变量落在 `src/style/article-shell.scss`（`--rbook-font-*`、`--rbook-body-*`、`--rbook-code-*`、`--rbook-article-width`），规则落在 `src/markdown-style/typography.scss`，均限定在 `.rbook-article .markdown-body` 内。
- 随本决策一起移除了 `markdown.scss` 与 `style.scss` 的 62.5% 根字号缩放；受影响的旧 `rem` 值已按原有效像素换算为 `px`，避免因根字号改为 16px 而意外放大。
- 验证 fixture：`tests/fixtures/markdown/typography.md`（构建期检查见 `tests/fixture.test.js` 与 `tests/markdown-style.test.js`）。
