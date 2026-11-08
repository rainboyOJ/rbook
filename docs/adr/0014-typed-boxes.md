# 带类型的方框：`::: kind` 取代「第一段即标题」

`::: colorfulbox` 想表达的是教科书里的「定义 / 定理 / 算法核心」这类方框，但它的标题不是语法，而是**容器的第一个段落**：`.colorfulbox > p:first-child` 用 `position: absolute` 把这一段拔出来，做成浮在边框上的胶囊。这个设计有五处代价，全都能在现有语料里找到实例：

- **标题是内容，所以它会被截断。** 全站 58 块里有 4 块的首段是完整句子（`book_note` 的「任何大于1的整数都可以唯一分解成素因数乘积的形式」、`slope` 的「定理$2$: $b$不可能成为答案.」），胶囊带 `white-space: nowrap` + `text-overflow: ellipsis`，`max-width: calc(100% - 24px)` 之下长句直接丢掉后半截，页面上不报错、原件里也看不出来。
- **标题是内容，所以它必须存在。** `book_note` 里有 15 块压根没有标签，首段就是定理陈述本身；它们一律被渲染成一个描述陈述的胶囊。
- **标题是内容，所以它必须是个段落。** 3 块的首节点是 `![]()` 图片（`monotonic_stack/roj3032.md`）、1 块是代码围栏（`stack_seq/problem.md`）、1 块是 `$$` 公式（`book_note`）——这些块的首节点一旦被绝对定位，整段内容就被从文档流里拔出去。
- **没有参数。** `validate: /^colorfulbox$/i`，写 `::: colorfulbox 定义` 会让整块失效，变成一行普通文字。
- **没有类型。** 「定义」和「注意」在视觉上完全一样，因为没有 kind 这个概念，只有一段被染色的文字。

与此同时站内还有三套功能重叠的实现，各自造了一小块世界：`::: oneWordAlgo`（19 处，硬编码注入 `.title`「一句话算法」）、`::: warning` / `::: info` / `::: error`（14 / 25 / 0 处，注入 `.rbook-callout-label`）、`::: blackboard`（0 处）。四套容器、四套 CSS、三套命名法，做的事都是「一个带标签的方框」。

所以这次不是给 `colorfulbox` 打补丁，而是把这四套合成一套**带类型的方框**：类型进语法，标题进语法，正文一个字节不动。

## 语法

```
::: kind [标题] [id=…] [icon=…] [label=…]
…正文…
:::
```

- `kind` 不区分大小写，可用英名或中文别名（下表）。
- `标题` 是**位置参数**，占行内除选项外的全部内容，可以直接带空格与中文标点，不必加引号；含 `=` 或需要从 `key=value` 字面开始时才加引号。
- 选项只认 `id` / `icon` / `label` 三个，一律 `key=value`，且必须写在标题之后（从第一个形如 `key=value` 的片段起，剩下的全按选项解析）。
- 标题走 **inline markdown**：`$k_3=K(a,c)$`、`` `in_deg` ``、`**加粗**` 都生效。标题是行内内容，不允许出现块级语法。
- 标题可省略。省略时只有标签行。
- 收尾仍是单独一行 `:::`。

例子：

```
::: theorem 一维四边形不等式具有决策单调性
对任意 $a\le b\le c\le d$，有 $w(a,c)+w(b,d)\le w(a,b)+w(c,d)$。
:::

::: 定义 欧拉函数 id=def-euler
$\varphi(n)$ 表示 $1\sim n$ 中与 $n$ 互质的数的个数。
:::

::: note
没有标题的说明块。
:::
```

**不自动编号。** 现有正文里有作者手写的 `定义$1$`、`定理 2:`、`推论1` 三种格式，自动接管必然与正文里「由定理 2 可知」的说法对不上。编号继续写在标题里；要能被引用就加 `id=`，正文用普通 Markdown 锚点链接 `[定理 2](#thm-2)`，不新增引用语法。

## kind 表

| kind | 中文别名 | 默认标签 | 色组 | 图标 |
| --- | --- | --- | --- | --- |
| `definition` | 定义 | 定义 | 蓝 | — |
| `theorem` | 定理 | 定理 | 蓝 | — |
| `lemma` | 引理 | 引理 | 蓝 | — |
| `corollary` | 推论 | 推论 | 蓝 | — |
| `algorithm` | 算法 | 算法 | 蓝 | — |
| `note` | 说明 | 说明 | 蓝 | — |
| `proof` | 证明 | 证明 | 灰 | — |
| `example` | 例 | 例 | 灰 | — |
| `summary` | 总结 | 总结 | 灰 | — |
| `warn` | 注意、警告 | 注意 | 琥珀 | ⚠ |

色组只有三组，全部复用现有 token：蓝 = `--rbook-accent`，灰 = `--rbook-muted`，琥珀 = `--rbook-warning-border`（底色分别取 `--rbook-accent-muted` / `--rbook-surface-muted` / `--rbook-warning-bg`）。**灰组是「依附于前文的附属内容」**——证明、例子、总结都不是新的主张；蓝组是「这一段在陈述某件事」；琥珀组是「读者容易错」。深色模式不需要新变量。

图标只有 `warn` 自带（1em 内联 SVG，`fill: none; stroke: currentColor; stroke-width: 1.6`，与 `[[[rbook:]]]` 的 `LINK_MARKS` 同一套画法）。定理性内容之间在 1em 里画不出本质区别，硬加图标只会制造噪声。想给某个块换记号就写 `icon=`，取值只有一个小注册表（`warning` / `info` / `bulb` / `star` / `scale` / `none`），写错忽略并给警告。

`label=` 覆盖显示标签，`id=` 落到容器上（`id` 会原样写进 HTML，因此 `#def-euler` 可被链接；重复 id 由构建诊断报出）。

## 渲染契约

```html
<div class="rbook-box rbook-box--theorem" id="thm-1">
  <div class="rbook-box__head">
    <span class="rbook-box__kind">定理</span>
    <span class="rbook-box__title">一维四边形不等式具有<em>决策单调性</em></span>
  </div>
  <div class="rbook-box__body">
    <p>…</p>
  </div>
</div>
```

- 标题在**文档流里**：`__kind` 与 `__title` 同行 flex，标题可换行、可撑长，`__kind` 不收缩（`flex: 0 0 auto`），中间用 `margin-inline-end` 留气口。这一条把绝对定位那套 CSS 与它的三个坑一起删掉。
- 左侧竖条 3px 由 kind 着色（`border-inline-start`），盒子底色取对应色组的极浅一档，圆角 6px，无阴影。
- 无标题时整个 `__head` 只剩 `__kind`，行高与正文一致，不额外占空。
- 折叠交互、`prefers-reduced-motion` 与现有 `extra-link` 一致。

`::: fold` 保持独立：它的语义是「可以收起」，与「这是一个定理」正交，混进 kind 会引出「定义能不能折叠」这种没有答案的问题。但 `fold` 补一个位置标题，参数解析与 kind 共用：`::: fold 展开看这张图` → `<summary>展开看这张图</summary>`，现在 27 处全都是写死的「点击」。

## 兼容与迁移

旧名字**一律废弃**，不留别名：`colorfulbox`、`oneWordAlgo`、`warning`、`info`、`error`、`blackboard` 全部从容器注册表里删除，命中 `validate` 的只剩 kind 与 `fold` / `pseudocode`。因此迁移必须覆盖**全部** 58 块 colorfulbox（含 9 块在 `problem.md` / `summary.md` 这类未发布文件里的）、19 块 oneWordAlgo、39 块 warning/info——漏一处的表现是页面上出现一行 `::: colorfulbox` 文字。

映射关系：

| 旧 | 新 |
| --- | --- |
| `::: colorfulbox` + 首段 | `::: <kind> <首段>`，kind 按首段关键词判定（定义/定理/推论/证明/总结/引入/核心思想/口诀） |
| `::: oneWordAlgo` | `::: algorithm`（默认标签「算法」；「一句话算法」这四个字不再硬编码） |
| `::: warning` | `::: warn` |
| `::: info` | `::: note` |
| `::: error` | （0 处使用，直接删除） |
| `::: blackboard` | （0 处使用，连同它的 SCSS 一起删除） |

迁移是脚本 + 人工复核两步：脚本负责机械改写（把首段提成标题、删掉首段、替换容器名），并把三类无法自动判断的块列成清单交给人拍板——15 块没有标签、首段本身就是陈述（`book_note`）、4 块长句标题、3 块首节点是图片/公式/代码。**正文文字一个字节不改**，只动 `:::` 那一行和首段搬家的位置。

## 守卫

- **未知 kind 给诊断。** 现有的「未注册 `:::` 名字原样输出」是本项目最容易静默出错的坑（skill 里专门当坑写着）。新的容器解析器对「形如 kind 但不认识」的 info string 记一条 `Diagnostic`（文件、行号、疑似拼写），构建不阻断，`render-check.js` 里把它当方言残留报出来。`render-check.js:221` 的 allowlist 正则同步改。
- **测试钉契约。** `tests/fixture.test.js` 里 `class="colorfulbox bg-light"` / `class="oneWordAlgo"` 的断言全部替换成 `rbook-box rbook-box--<kind>`、`rbook-box__kind`、`rbook-box__title`，并断言旧类名与 `::: colorfulbox` 不再出现。
- **skill 同步。** `.agents/skills/rbook-markdown/SKILL.md` 第六节换成新的方言表（kind 表、参数、锚点用法、`fold` 标题），并删掉「colorfulbox 不能带参数」「未注册的 `:::` 名字不会提示」这两条已经过时的坑。

## 方言表（将替换 SKILL.md 第六节）

| 写法 | 渲染成 | 说明 |
| --- | --- | --- |
| `::: 定义 …` / `::: definition …` | 蓝左条方框，标签「定义」 | 中文名与英文名等价，大小写不敏感 |
| `::: 定理` `::: 引理` `::: 推论` `::: 算法` `::: 说明` | 蓝左条方框 | 主陈述类 |
| `::: 证明` `::: 例` `::: 总结` | 灰左条方框 | 附属内容，不抢镜 |
| `::: 注意` / `::: warn` | 琥珀左条方框 + ⚠ | 读者容易错的地方 |
| 位置标题 | 加粗标题，与标签同行 | 可写 `$数学$`、`` `代码` ``、`**加粗**`；可省略 |
| `id=` | `<div id="…">` | 正文用 `[定理 2](#thm-2)` 链接 |
| `label=` | 替换默认标签文字 | 需要「口诀」「引理 3」这类自定义说法时用 |
| `icon=` | 替换图标（`warning`/`info`/`bulb`/`star`/`scale`/`none`） | 只有 `warn` 自带图标，其余默认无 |
| `::: fold 标题` | `<details><summary>标题</summary>` | 标题可省略，省略时 summary 仍是「点击」 |
| `::: pseudocode` | 伪代码块 | 不变，`:::` 与名字之间必须有空格 |
| `::: colorfulbox` `::: info` `::: oneWordAlgo` `::: warning` `::: error` `::: blackboard` | **已移除**，原样输出 | 迁移后不应再出现；构建诊断会点名文件与行号 |

## 不做的事

- 不做自动编号、不做 `[[:ref:]]` 专用引用语法。
- 不做跨容器嵌套（markdown-it-container 的限制仍在），也不在本次解决。
- 不新增色相 token、不做「每个 kind 一个图标」、不做 `class=` 逃生口。
- 不改 `::: pseudocode`。

## 实施记录

- 插件：`src/publishing/markdown/plugins/containers.ts`（kind 表、参数解析、`fold` 标题、
  未注册容器的诊断）；样式：`src/markdown-style/markdownPlugin/rbook-box.scss`。
- 迁移脚本：`scripts/migrate-box-containers.cjs`（一次性，留档备查）。58 块 colorfulbox、
  19 块 oneWordAlgo、39 块 warning/info 全部改写，其中 22 块由脚本判定、人工复核确认 kind
  与标题；正文文字一个字节没动。
- 删除：`markdownPlugin/colorfulbox.scss`、`markdownPlugin/oneWordAlgo.scss`、
  `vendor/markdown-r.scss` 里的 `.blackboard` 与 `.warning/.info/.error` 段落、
  `article-shell.scss` 里的 `.colorfulbox` 覆盖。
- 契约：`tests/fixtures/markdown/containers.md` 重写，新增 `unknown-container.md`；
  `render-check.js` 的 `:::` allowlist 换成 kind 表。

## Status

accepted
