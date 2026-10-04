---
title: Rbook 正文排版与主题样式改造计划
tags:
  - rbook
  - typography
  - css
  - design-system
aliases:
  - 正文排版改造计划
---

# Rbook 正文排版与主题样式改造计划

## 目标

参考 [赫蹏 Heti](https://sivan.github.io/heti/) 的中文排版原则，重建 Rbook 正文区域的排版基础，使正文、标题、行内代码、代码块和暗色主题具有统一的字体、字号、行高、间距和颜色体系。

本次改造只作用于文章正文区域，保留 Markdown 插件、伪代码、公式、代码复制和现有页面结构的功能行为。

## 已确认的设计决策

- 主要阅读场景是中文算法正文，桌面阅读优先；代码块可以独立横向滚动。
- 正文采用现代无衬线系统字体，代码采用系统等宽字体，不加载外部 Web Font。
- 正文基线固定为 `16px / 24px`，正文宽度固定为 `42em`。
- 代码块固定为 `14px / 22px`，行内代码使用正文的 `0.875em`。
- 保留现有蓝灰色主题，只降低饱和度并重新调整层级和对比度。
- 第一版只使用 CSS 处理混排，不引入 Heti 增强脚本或其他运行时排版脚本。
- 移动端正文仍保持 `16px`，代码块单独横向滚动，不通过缩小字号解决宽度问题。
- 浅色和暗色主题分别使用适合自身背景的语法高亮配色。
- 旧样式先审计和收拢，确认没有使用后再删除，不直接破坏旧文章。

## 现状问题

- [markdown.scss](../src/markdown-style/markdown.scss) 和 [style.scss](../src/style.scss) 都设置了 `html` 的 `62.5%` 根字号，导致 `rem` 在不同样式文件中的含义不直观。
- [article-shell.scss](../src/style/article-shell.scss)、[markdown_perfect.scss](../src/markdown-style/markdown_perfect.scss) 和 Prism 主题分别定义了字体、字号、行高和颜色，缺少统一的设计变量。
- 正文最大宽度目前在多个地方出现 `800px` 和 `900px`，中文段落行宽偏长。
- 行内代码只针对部分标签设置样式，代码字号、背景色、边框和正文的关系不统一。
- 代码块、行号、伪代码各自使用不同的行高和字号，容易出现视觉错位。
- 浅色主题的代码背景与页面背景接近，暗色主题的 Prism 颜色又与项目主题变量分离。
- `.prose` 和 `code[v-pre]` 等旧规则仍然存在，与当前 `.markdown-body` 的渲染结构并存，增加了覆盖冲突的可能。

## 非目标与边界

- 不重做站点壳、侧边栏、导航和页面工具按钮的视觉设计。
- 不改变 Markdown 扩展语法、发布文章路径、代码复制行为或插件输出契约。
- 不在第一轮引入外部字体、Heti 全量 CSS、自动混排脚本或标点挤压脚本。
- 不要求所有代码内容适应正文宽度；长代码保留横向滚动能力。
- 不把伪代码、公式、Mermaid 和 PlantUML 强行套用普通代码块的 token 配色；它们只共享基础字号和间距原则。

## 参考原则

Heti 的基础排版参数可以作为第一版基线：

| 项目 | 第一版目标 |
| --- | --- |
| 正文字号 | `16px` |
| 正文行高 | `24px`（`1.5`） |
| 正文宽度 | `42～48em` |
| H1 | `32px / 48px` |
| H2 | `24px / 36px` |
| H3 | `20px / 36px` |
| H4 | `18px / 24px` |
| H5 | `16px / 24px` |
| H6 | `14px / 24px` |
| 标题字重 | `600` |
| 中文 H1～H3 字间距 | 约 `0.05em` |
| 行内代码字号 | 正文的 `0.875em` |
| 段落间距 | 上 `12px`，下 `24px` |

这些数值作为起点，不直接复制 Heti 的全部 CSS。Rbook 有算法代码、伪代码和交互容器，需要保留自己的组件边界。

## 实施阶段

### 第一阶段：建立排版变量

在 [article-shell.scss](../src/style/article-shell.scss) 或新的排版变量文件中集中定义：

- 正文字体族；
- 标题字体族；
- 等宽代码字体族；
- 正文字号和行高；
- 正文宽度；
- 正文、弱文本、边框、链接、代码背景和代码边框颜色。

所有变量都需要提供浅色和暗色两套值。正文规则统一限定在 `.rbook-article .markdown-body` 内，避免影响侧边栏和工具按钮。

输出：一组正文、标题、代码、宽度、间距和颜色变量，以及一份变量使用说明。

### 第二阶段：重建正文节奏

在 [markdown.scss](../src/markdown-style/markdown.scss) 中统一以下元素：

- `p`、列表、引用、表格和分隔线的上下间距；
- `h1` 至 `h6` 的字号、行高、字重和相邻标题间距；
- 中文正文的换行、溢出和适度字间距；
- 链接、强调、删除线、脚注和图片说明的文字层级；
- 使用逻辑属性表达内外边距，方便移动端布局。

正文宽度建议先收敛到 `42～48em`。代码块允许横向滚动，不强迫代码内容跟随正文宽度换行。

本计划已将正文宽度收敛为 `42em`；`48em` 只作为后续可用性复评时的候选值，不属于第一轮目标。

### 第三阶段：统一行内代码

为 `.markdown-body :not(pre) > code` 建立独立规则：

- 使用统一的 `ui-monospace` 字体族；
- 字号为正文的 `0.875em`；
- 使用轻微背景色、圆角和水平内边距；
- 使用主题变量控制文字和背景颜色；
- 不使用过重的阴影边框；
- 覆盖段落、列表、引用、表格和标题中的行内代码；
- 确保行内代码不会继承代码块的 `white-space`、padding 或 token 颜色。

### 第四阶段：统一代码块和行号

整理 [markdown-r.scss](../src/markdown-style/vendor/markdown-r.scss)、[fence.ts](../src/publishing/markdown/plugins/fence.ts) 和 Prism 主题之间的关系：

- 代码块字号统一为约 `14px`；
- 代码块行高统一为 `1.5～1.6`；
- 行号和代码共用同一组字号、行高和垂直内边距变量；
- 代码块容器负责背景、行号分隔线和滚动行为；代码块无边框无圆角，靠背景色与页面分层，行号列左侧留白与代码列 padding 呼应；
- Prism 主题只负责语法 token 颜色；
- 复制按钮、行号列和代码列在浅色与暗色主题中保持相同布局规则；
- 删除或收拢旧的重复行号规则，避免 `code[v-pre]` 与新 fence 结构互相覆盖。

### 第五阶段：调整颜色与暗色主题

基于现有 `--rbook-*` 变量重新校准颜色层级：

- 正文使用偏中性的深色，避免纯黑；
- 弱文本和行号降低对比度，但保持可读；
- 浅色代码背景与页面背景拉开小幅差异；
- 暗色代码背景与正文背景分层；
- 引用、表格边框、分隔线和提示框统一使用边框变量；
- 检查链接、行内代码和 Prism token 在两种主题下的对比度。

### 第六阶段：中文排版增强与验证

先使用 CSS 完成稳定的基础排版，再评估是否需要引入自动中西文混排或标点挤压脚本。第一版不直接引入 Heti 全量 CSS，避免覆盖现有 Markdown 插件。

验证内容包括：

- 中文、英文和中英混排段落；
- H1～H6、列表、引用、表格和脚注；
- 行内代码、普通代码块、带行号代码块和伪代码；
- 数学公式、Mermaid、PlantUML 和容器组件；
- 浅色与暗色主题；
- 手机、平板和桌面宽度；
- 长代码横向滚动和复制按钮行为。

建议建立一个只用于排版验证的 Markdown fixture，至少包含以下内容：

1. 中文段落、中英文混排和带行内代码的段落；
2. H1～H6、相邻标题、列表、嵌套列表、引用和表格；
3. 普通代码块、带语言代码块、带行号代码块和伪代码；
4. 行内公式、块公式、Mermaid、PlantUML 和容器组件；
5. 浅色主题、暗色主题、窄屏和宽屏状态。

排版 fixture 已落在 [tests/fixtures/markdown/typography.md](../tests/fixtures/markdown/typography.md)，
覆盖第 1～4 项（第 5 项的浅/暗色、窄/宽屏状态需要浏览器人工切换检查）。
对应构建检查见 [tests/fixture.test.js](../tests/fixture.test.js) 的
typography 用例与 [tests/markdown-style.test.js](../tests/markdown-style.test.js) 的排版变量用例。

浏览器人工检查至少覆盖桌面宽度和手机宽度，并记录字体回退、代码滚动、行号对齐、链接对比度和正文横向溢出结果。

### 排版 fixture 验收清单

对 `tests/fixtures/markdown/typography.md` 渲染出的页面逐项检查：

| # | 检查点 | 期望 |
| --- | --- | --- |
| 1 | 正文行宽 | 正文区域宽度为 42em，居中，无横向溢出 |
| 2 | 段落节奏 | 段落间距稳定（上 12px / 下 24px），不随内容抖动 |
| 3 | 标题层级 | H1～H6 字号递减、600 字重、间距节奏与计划参数表一致 |
| 4 | 行内代码 | 正文/列表/引用/表格/标题中的行内代码外观一致，与代码块明显区分 |
| 5 | 行号对齐 | 行号列与代码逐行对齐，缩放窗口后仍对齐；行号列左侧有留白，不顶背景块边缘 |
| 6 | 长代码滚动 | 长行代码块内部横向滚动，正文本身不溢出 |
| 7 | 复制按钮 | 复制按钮在浅/暗色主题中均清晰可见、可用 |
| 8 | 公式 | 行内与块级公式在 42em 宽度内正常显示，超宽可滚动 |
| 9 | 容器组件 | oneWordAlgo / info 等容器与正文边界、间距协调 |
| 10 | 暗色主题 | 切换暗色后正文、代码块、引用、边框、链接颜色层级清晰 |
| 11 | 手机宽度 | 375px 宽度下正文保持 16px，无横向溢出 |
| 12 | 字体回退 | 无中文 Web Font 时回退到系统字体，无豆腐块与明显度量突变 |

## 建议的文件改造顺序

1. 在 [article-shell.scss](../src/style/article-shell.scss) 集中定义排版和颜色变量。
2. 新增或整理正文基础规则，并从 [markdown.scss](../src/markdown-style/markdown.scss) 统一导入顺序。
3. 收拢 [markdown_perfect.scss](../src/markdown-style/markdown_perfect.scss) 中的旧正文和代码规则。
4. 调整 [markdown-r.scss](../src/markdown-style/vendor/markdown-r.scss) 与 [fence.ts](../src/publishing/markdown/plugins/fence.ts) 的代码块、行号和复制按钮样式。
5. 为浅色和暗色主题选择并接入对应的 Prism 配色。
6. 构建排版 fixture，完成浏览器人工检查，再运行类型检查和完整构建。

每一步都应保持发布文章的 HTML 结构和现有插件功能可用；如果必须改变结构，应先更新对应的渲染契约和验证样例。

## 验收标准

- 正文区域只有一套明确的字号、行高和字体变量来源。
- 标题层级和段落间距具有稳定的垂直节奏。
- 行内代码在所有正文语境中外观一致，并与代码块明显区分。
- 代码与行号逐行对齐，字号和行高不再分别硬编码。
- 浅色和暗色主题的正文、代码块、引用、边框和链接颜色具有清晰层级。
- 移动端不出现正文横向溢出，代码块可以独立横向滚动。
- 现有 Markdown 插件和文章构建流程通过类型检查与构建验证。

## 实施记录（第一轮完成情况）

第一轮改造已完成并通过 `npm run typecheck`、`node --test tests/*.test.js`（132 项）与 `npm run build:core`：

- 排版与颜色变量集中定义在 [article-shell.scss](../src/style/article-shell.scss)（正文 16px/24px、代码 14px/22px、行内代码 0.875em、正文宽度 42em，浅/暗两套颜色）。
- 新增 [typography.scss](../src/markdown-style/typography.scss)：正文节奏、标题层级、行内代码、代码块度量与浅色 Prism token 配色，全部限定在 `.rbook-article .markdown-body` 内。
- 移除 [markdown.scss](../src/markdown-style/markdown.scss) 与 [style.scss](../src/style.scss) 的 62.5% 根字号；受影响的旧 `rem` 值（含站点壳与旧插件）已按原有效像素值换算为 `px`。
- [markdown_perfect.scss](../src/markdown-style/markdown_perfect.scss) 中旧的行内代码配色、`code[v-pre]` 计数行号、标题与引用样式已收拢删除，正文/代码统一走 typography.scss。
- [markdown-r.scss](../src/markdown-style/vendor/markdown-r.scss) 的行号列与代码列改为共享 `--rbook-code-*` 变量；[fence.ts](../src/publishing/markdown/plugins/fence.ts) 不再输出内联定位样式，复制按钮样式收括到 markdown-it-code-copy.scss。
- 浏览器人工检查后的视觉修正：所有代码块（含带行号容器与独立 `<pre>`）去掉 border 与圆角，靠 `--rbook-code-bg` 背景色与页面分层；行号列与代码列之间的分隔线保留；行号列左侧增加 14px 留白，与代码列 padding 呼应；行内代码保留 border 以形成层级对比。
- 旧 typora-latex-theme 的字体、标题 em 缩放、表格衬线字体改为引用 `--rbook-*` 变量，保留标题自动编号与三线表线宽。
- 排版 fixture 与验收清单见上文；第 5 项主题/宽度人工检查待浏览器验证。

第一轮遗留：浅色/暗色主题与手机/桌面宽度的浏览器人工检查尚未执行；暗色主题下的 Prism token 沿用 prism-vsc-dark-plus，浅色 token 为新配色，需在 fixture 页面上确认对比度。

## 相关资料

- [Heti 中文排版增强](https://sivan.github.io/heti/)
- [中文排版需求](https://www.w3.org/TR/clreq/)
- [Markdown 样式入口](../src/markdown-style/markdown.scss)
- [文章主题变量与壳层样式](../src/style/article-shell.scss)
- [代码块行号样式](../src/markdown-style/vendor/markdown-r.scss)

## 决策记录

- [ADR 0009：文章正文采用系统字体和局部排版 CSS](./adr/0009-article-typography-system-fonts.md)
