# 发布契约目标标记

这些标记来自当前 `dist/` 输出，是新渲染器 (Phase 3) 必须复现的 HTML 特征。

## 数学公式 (KaTeX)
- `class="katex"` — 行内公式
- `class="katex-display"` — 块级公式
- `class="katex-mathml"` — 语义化 MathML 后备

## 代码块
- `class="code-with-linenumber"` — 带行号/复制按钮的代码块
- `class="line-number"` — 行号元素
- `.token.keyword` / `.token.punctuation` / `.token.operator` — 语法高亮

## 容器（`:::` 带类型的方框，见 ADR 0014）
- `class="rbook-box rbook-box--theorem"` — 方框本体，后缀是 kind
- `class="rbook-box--hue-accent"` / `--hue-muted` / `--hue-warning` — 三组色相
- `class="rbook-box__head"` — 标签与标题同一行
- `class="rbook-box__kind"` — 类型标签（定义 / 定理 / 注意 …）
- `class="rbook-box__title"` — 位置标题，走 inline markdown
- `class="rbook-box__icon"` — 1em 内联 SVG，只有 `warn` 默认带
- `<details><summary>…</summary>` — `::: fold 标题`

## 链接与嵌入
- `class="extra-link extra-link--article"` — `[[[rbook:...]]]` 站内文章链接
- `class="extra-link extra-link--problem"` — `[[[p:...]]]` 题目链接
- `class="extra-link__mark"` — 两种交叉引用前缀的 1em 内联 SVG 标记（不再有 `<img>` favicon）
- `class="extra-link missing"` — 找不到目标的灰色方括号标记
- `class="problem_list_content"` — `+p` 题目列表
- `class="image-wrapper"` — `.excalidraw.svg` 容器
- `class="image-extension-badge"` — Excalidraw 按钮

## 图表
- `class="mermaid"` — Mermaid 图表
- `class="plantuml"` — PlantUML 图表
- `class="dot"` — Graphviz DOT

## 伪代码
- `pseudocode` 标签 — 伪代码块

## 杂项
- `class="header-anchor"` — 标题锚点链接
- `class="info-header"` — 文章页头
- `class="badges"` — 徽章栏
- `class="video-container"` — 视频容器
- `class="iframe-container"` — iframe 容器