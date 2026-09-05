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

## 容器
- `class="oneWordAlgo"` — 一句话算法
- `class="colorfulbox bg-light"` — 彩色盒子
- `class="warning"` — 警告
- `class="info"` — 信息
- `class="error"` — 错误
- `class="blackboard"` — 黑板

## 链接与嵌入
- `class="extra-link"` — `[[[rbook:...]]]` 链接
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