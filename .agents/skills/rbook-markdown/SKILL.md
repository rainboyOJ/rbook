---
name: rbook-markdown
description: >-
  编写或修改 /home/rainboy/mycode/newRbook_ejs 这本 rbook 电子书里的 Markdown 时必须遵守的方言说明（站内链接 [[[rbook:]]]、题目链接 [[[p:]]]、include 与 file=、animate 与 dsa 动画卡片、数学、::: 容器、伪代码、自动生成的「相关题解」、catalog 与 front matter 里的 `rbook:` 元数据，以及哪些"通用 Markdown 语法"在本项目其实会静默失效）。当你在 book/ 下新建或编辑任何 .md（index.md、practice.md、teach_plan.md、problem.md…）、调整 book/catalog.yaml 或文章 front matter 的 `rbook:`、修一个链接/代码块/图片/公式/折叠框渲染不对、把别处的 Markdown 搬进来、或者要判断"这段写法本项目支持吗"时，都应先读这个 skill，不要凭 GitHub / Obsidian / VuePress 的语法直觉下手。
---

# rbook 的 Markdown 方言

这份文档只讲**本项目的方言**：它在 markdown-it 之上装了一批自定义插件
（`src/publishing/markdown/plugin-registry.ts`）。通用 CommonMark 部分不再赘述。

动手前先建立三个判断，它们决定了这个仓库的坑长什么样：

1. **有些方言是"块级预处理"，跑在 Markdown 解析之前**
   （`[[[include:]]]`、`[[[animate:]]]`、EJS 宏都挂在 `core.ruler` 的 `normalize` 之前）。
   这类指令**在代码围栏里也会展开**——想在示例里展示它们，必须转义。
   **`[[[dsa:]]]` 是例外**：它自己做了代码段屏蔽，围栏与行内代码里保持原文。
2. **绝大多数失效是静默的**：未注册的 `:::` 名变成普通段落（只有容器会额外给一条构建诊断）、`[g1:]` 标签为空时被丢弃、
   `[[wikilink]]` 原样输出、`++插入++` 只是文本。不报错，只是"没效果"。
3. **判断"到底生效了没有"的唯一可靠办法是跑真实渲染器**，本 skill 带了一个脚本（见文末）。

## 一、文章骨架（先有元数据，再有正文）

```
book/<章>/<文章目录>/
├── index.md          # 正文 + 元数据（front matter 的 rbook: 子键）
├── images/           # 相对 index.md 引用的图片
└── xxx.animation.ts  # 可选：交互动画入口
```

- **菜单的唯一真相是 `book/catalog.yaml`**。文章必须在那里登记，否则
  `npm run check:catalog` 会判为孤儿（写了但永远不会发布）。
- **元数据写在 md 自己的 front matter 里，没有 `config.yaml`**（2026-11 起；
  见 `docs/adr/0013-metadata-in-front-matter.md`）。一份元数据只描述一个文件，
  所以扁平 `.md` 也能当文章，不会再有「目录 config 作用到兄弟文件」的错配。

  ```markdown
  ---
  title: Bellman-Ford 最短路      # 正文标题，可以长
  menu_title: Bellman-Ford        # 菜单短名，可选
  rbook:                          # 其余构建字段
    id: bellman-ford
    pre: [dijkstra]
    teach_plan: teach_plan.md
    copy: [assets/a.png]
    code_template:
      - title: Bellman-Ford 最短路
        code: ./bellman_ford.cpp
  ---
  ```

  `rbook.id` 是 `[[[rbook: id]]]` 的唯一键；缺省时由路径推导（`index.md` 用目录名，
  其它用文件名）。`rbook.copy` 里的文件会在构建时复制到该文章的 dist 目录。
  **构建字段写在顶层会被忽略并报警告**，只认 `rbook:` 子键；`title` / `menu_title` 例外。
- 标题分两轨，各有唯一出处：
  - 正文：front matter 的 `title`（可长）→ `catalog.yaml` 的 title。
    页面 `<title>`、正文 H1、`dist/catalog.json` 都用它。
  - 菜单：front matter 的 `menu_title`（可选，要短）→ `catalog.yaml` 的 title。
    侧边栏只显示这一轨，写完长 `title` 想让菜单短一点就补 `menu_title`
    （超过约 16 个汉字会被 `npm run check:catalog` 报 warning）。
- 不写 `menu_title` 时菜单沿用 `catalog.yaml` 里的短名，两者可以同名也可以不同名——
  同一页出现短菜单名和长正文标题是预期行为。
- 侧边栏搜索匹配「菜单名 + 面包屑 + 文章 id + 正文标题」，所以菜单显示 `LIS` 时搜
  `lis`、`最长上长子序列` 都能命中。
- 正文第一行惯例写 `[[TOC]]`（也认 `[TOC]`、`[[toc]]`、`[[Toc]]`），在该位置渲染页内目录
  `<nav class="table-of-contents">`，收 h2、h3。宽屏时在正文右侧跟随阅读高亮，窄屏时在正文内折叠显示。没有这个占位符就没有页内目录
  （侧边栏菜单来自 catalog，与此无关）。

## 二、站内与题目链接

| 写法 | 用途 | 渲染成 |
|---|---|---|
| `[[[rbook: article_id]]]` | 链接到书内文章 | `▤ 文章标题`（文档轮廓标记） |
| `[[[p: luogu-P1048]]]` | 链接到题目 | `↗ luogu P1048: 采药`（右上箭头标记） |
| `[[[p: luogu-P1048 \| 采药]]]` | 同题，强制显示指定标题 | 同上 |

- 两种引用都是**无方括号、无图标位图**的“标记 + 名字”：文章用文档轮廓表示“还在书里”，
  题目用 ↗ 表示“离开本书去 OJ 站”。标记是内联 SVG，跟随 `currentColor`，
  静态 55% 不透明度，hover 时整颗出 1px 细下划线。样式在
  `bin/triple-square-brackets/extra_link.scss`，类名 `extra-link--article` /
  `extra-link--problem`。旧版的 `[<img favicon/> Rbook: xxx]` 外形已废弃。

- **必须是三方括号**。`[[id]]`、`[[id|别名]]` 这类 Obsidian 双链不参与解析，会原样输出。
- 被反引号包住就失效：`` `[[[rbook: x]]]` `` 会变成行内代码里的字面量。
- `id` 必须是 catalog/config 里存在的 id，否则渲染成 `[rbook: xxx]` 灰标记并报 warning。
- 题目写法是 **`oj-pid`，按第一个短横切分 oj 与 pid**，因此 pid 自己可以带短横：
  `[[[p: vjudge-HDU-1556]]]`、`[[[p: noi_openjudge-ch0304-2406]]]`（短横会转成 `/`）。
  luogu 题号 `1048` 与 `P1048` 等价。已知 oj：luogu、roj、acwing、vjudge、noi_openjudge、
  codeforces、atcoder、poj、hdu、usaco、leetcodecn。题目链接可以写在表格单元格里。
- `[[[pp: …]]]` / `[[[problem_info_solution: …]]]` **已废弃**（语义等同 `p`，还会刷 warning）。
- 生成的是**绝对 URL**（`https://rbook.roj.ac.cn/…`），本地 dev 点它会跳到线上站。
  这是既有行为，别为了"本地能跳"改成相对路径。
- 普通 Markdown 链接也能写，但 `[x](../foo/index.md)` 里的 `.md` **不会**被改写成 `.html`，
  发布产物里就是死链。跨文章引用请统一用 `[[[rbook: id]]]`。

## 三、内容复用：include 与 file=

````md
```cpp file=./bellman_ford.cpp
```

```cpp file=/algo_template/graph/dijkstra.cpp
```

[[[include: ./practice.md]]]
````

- `file=` 写在 fence 的 info 里（语言名 + `file=`），内容以文件为准；fence 内自己写的正文会被覆盖。
  顺手留一个空的 fence 体是可以的，也是仓库里的惯用写法。
- `[[[include: ./x.md]]]` 把整个 md 片段内联进来，参与正常解析，可嵌套（默认上限 5 层）。
- 相对路径相对于**写下这段引用的那个文件**；`/xxx` 形式相对项目根。
- 只允许访问 `book/` 与 `algo_template/`。越界或不存在是 error 级诊断，并在页面上渲染
  `[include 失败: …]`（绝不静默丢内容）。
- 旧写法 `<%- include("./x.md") %>` 仍可用但会报"已弃用"警告，新内容不要再用。

## 四、交互动画（两种，语义不同）

书里有**两个**动画指令，不要混用：

| 语法 | 含义 | 适用场景 |
|---|---|---|
| `[[[animate: ./x.animation.ts]]]` | 内嵌**本书打包**的 TS 动画，在正文里直接跑 | 动画逻辑简单、要与正文紧密配合 |
| `[[[dsa: slug]]]` | 生成一张**跳转**到外部动画站的卡片 | 演示已由 anima1 / dsa3 独立站点提供 |

### 4.1 `[[[animate:]]]`：内嵌本地动画

```md
[[[animate: ./dijkstra.animation.ts]]]
```

- 目标必须是 `.animation.ts`、位于 `book/` 内、文件必须存在，否则页面显示
  `动画加载失败: …`。`mount(context)` 的约定见 `docs/interactive-animation.md`。
- 路径同样相对当前 md 文件；写在被 include 的片段里则相对片段自身。
- ⚠️ 它是解析前预处理，**连代码围栏里也会展开**，所以在示例里展示必须转义
  （见第十一节）。

### 4.2 `[[[dsa:]]]`：外链动画卡片

```md
[[[dsa: quickSort]]]

[[[dsa: floyd | 自己起的标题]]]
```

- `slug` 必须在 `book/demos.json` 里注册；`| 自定义标题` 可选（slug 仍需校验）。
- 渲染成卡片：图标 + 标题 + 站点徽章（`anima1` / `dsa3`）+ 描述/标签 + `↗`。
- **写错 slug 会中断构建**（`phase: 'dsa'` 的 error 诊断），不会发出死链。
- 卡片指向两个外部站：anima1 是静态站，dsa3 是 Vue 站（`/Animate/<slug>/`）。
- `book/demos.json` 是**生成物，不要手改**：

  ```bash
  node scripts/sync-demos.mjs          # 从 ../dsa 与 ../dsa3_ts 重新抓取
  node scripts/sync-demos.mjs --check  # 只比对，防快照陈旧
  ```

- 与 `animate` 相反：**代码围栏与行内代码里的 `[[[dsa:]]]` 会保持原文**，
  所以写语法示例时不用转义。这是它专有的代码段屏蔽，不要假定其它指令也一样。
- 图标：anima1 用内置水果字体（`src/public/fonts/`），dsa3 用内联 SVG。
  - anima1 的水果图标：字体已内置，但**码点表**在本仓库（`src/markdown-style/dsa-card.scss`
    的 `$fruit-icons`）。anima1 新增水果时要同步这张表。
  - dsa3 的 SVG 图标：`sync-demos.mjs` 会把注册表里的 SVG body 抓进 `demos.json`
    的 `iconSvg` 字段，**新增图标无需改本仓库任何代码**。插件里还留着一张
    内置表，只作为旧快照的兜底。
- 想快速看有哪些可用 slug：

  ```bash
  node -e "const d=require('./book/demos.json');console.log(Object.keys(d.demos).join(' '))"
  ```

## 五、数学

- 行内 `$a^2+b^2=c^2$`；块级 `$$ … $$`；也支持 ```` ```math ```` fence（KaTeX displayMode）。
- 后端是 markdown-it-texmath（`delimiters: 'dollars'`），有两条**硬性格式要求**，
  不满足时公式会静默变成字面文本（构建期给 warning，不抛错）：
  - 开 `$` 之后、闭 `$` 之前**不能紧贴空白**：写 `$a$`，不要 `$ a $`；
  - `$$` 块内部**不能再出现 `$`**，且闭合 `$$` 前不能是反斜杠。
- `\R` 被预置为 `\mathbb{R}`。
- 行内代码里的 `$` 不受影响（`\`$notmath$\`` 保持原样）。

## 六、容器（`:::`）

### 6.1 带类型的方框：`::: kind [标题] [选项]`

教科书里那种「定义 / 定理 / 注意」的方框。**类型进语法，标题也进语法**——不要把标题写成
容器里的第一段（旧版 `colorfulbox` 就是这么干的，长标题会被省略号截掉、首节点是图片或公式
时整段还会跑出文档流）：

```md
::: theorem 一维四边形不等式具有决策单调性 id=thm-1
对任意 $a\le b\le c\le d$，有 $w(a,c)+w(b,d)\le w(a,b)+w(c,d)$。
:::

::: 定义 欧拉函数
$\varphi(n)$ 表示 $1\sim n$ 中与 $n$ 互质的数的个数。
:::

::: note
只有正文、没有标题的盒子。
:::
```

| kind | 中文别名 | 默认标签 | 色组 |
|---|---|---|---|
| `definition` | 定义 | 定义 | 蓝 |
| `theorem` | 定理 | 定理 | 蓝 |
| `lemma` | 引理 | 引理 | 蓝 |
| `corollary` | 推论 | 推论 | 蓝 |
| `algorithm` | 算法 | 算法 | 蓝 |
| `note` | 说明 | 说明 | 灰 |
| `proof` | 证明 | 证明 | 灰 |
| `example` | 例（例句 `例题` / `举例`） | 例 | 灰 |
| `summary` | 总结 | 总结 | 灰 |
| `warn` | 注意 / 警告 | 注意 | 琥珀 |

色组是层次而不是配色：**蓝 = 这一段在陈述某件事，灰 = 依附于前文的附属内容（证明、例、
总结、说明），琥珀 = 读者容易错**。选 kind 时按这个问，而不是按"好不好看"。

- **标题**是位置参数，占行内除选项外的全部内容，可以带空格与中文标点，不必加引号；
  里边能写 `$数学$`、`` `代码` ``、`**加粗**`。标题可省略。
- **选项**只有三个，一律 `key=value`，写在标题之后：
  - `id=thm-1` → 容器带上 `id`，正文用普通锚点链接 `[定理 2](#thm-1)` 引用；
  - `label=口诀` → 替换默认标签文字；
  - `icon=bulb` → 换图标，可选 `warning` / `info` / `bulb` / `star` / `scale` / `none`。
    只有 `warn` 默认带图标，其余都不带（定理与推论在 1em 里画不出本质区别，图标只是噪声）。
- **不自动编号**。编号写进标题里（`::: theorem 2: 决策单调性`），与正文「由定理 2 可知」对得上。
- 标题里要出现 `=` 时用引号：`::: theorem "当 a=b 时该式取等"`。

### 6.2 折叠：`::: fold [标题]`

```md
::: fold 展开看这张图
…
:::
```

标题进 `<summary>`，省略时 summary 是「点击」。`fold` 与方框是两个东西：折叠回答"要不要展开"，
方框回答"这是什么"，不要互相套（**不支持嵌套**）。

### 6.3 `::: pseudocode`

伪代码块，见下一节。

### 6.4 容错

- 收尾必须是**单独一行** `:::`；`:::` 与名字之间有没有空格都可以（`:::pseudocode` 除外）。
- **不支持嵌套**：内层容器的收尾会提前结束外层，剩下的 `:::` 变成正文。
- 写了不存在的 kind（如 `::: tehorem`）会在构建期给一条 `containers` 诊断，点名文件与行号，
  不会被静默吃掉——但那一段仍然会原样输出成文字，所以看到诊断就去修。
- 旧名字 `colorfulbox` / `oneWordAlgo` / `warning` / `info` / `error` / `blackboard`
  **已全部移除**，见到就说明是没迁移的老内容，改成对应的 kind。
- `::: tip` / `::: info` / `::: warning` 等**不是**合法 kind（`tip` 从来就没注册过），
  会原样输出成正文。贴士、技巧类内容请用 `::: note 标题 icon=bulb`（借用 `bulb` 灯泡图标）。

## 七、代码块与伪代码

- 普通代码块走 Prism 高亮 + 行号列 + 复制按钮。别名：`c++`→cpp、`py`/`python3`→python、
  `js`、`ts`、`sh`/`shell`/`zsh`→bash、`yml`。未收录语言会自动尝试加载，失败退化为纯文本。
- **代码标签页**：相邻的两个及以上 fence，在 info 里写 `[分组名:标签名]`：

  ````md
  ```cpp [g1:C++]
  int main() { return 0; }
  ```
  ```py [g1:Python]
  print(1)
  ```
  ````

  规则：**同一分组名 + 彼此相邻**才合成一组；中间隔了段落/列表边界就各自成组；
  分组名不同也各自成组；单块成组照常输出标签栏（只会有一个标签）。
  标签名可以写中文；分组名不要带空格、冒号、方括号。
  面板显隐是纯 CSS（`input:checked + div`），没 JS 也能点；JS 只把当前标签标成
  `.is-active`。打印时会展开全部版本并在每块上方标出 `data-label`。
  `file=` 可以和标签共存：`` ```cpp [g1:C++] file=./a.cpp ``。
- 特殊语言名：`mermaid`（前端 CDN 渲染）、`pseudocode`、`math`、`plantuml`、`dot`、`viz-dot`。
  `dot` 与 `viz-dot` 在构建期用 Graphviz 生成内联 SVG，图下提供折叠源码和复制按钮。每块只写一张图；也支持 `file=` 和代码标签页。构建机器必须安装 Graphviz 的 `dot` 命令，语法错误或生成失败会中断构建。详见 `docs/graphviz.md`。
  ⚠️ `plantuml` 目前**只输出 `<pre>`**，仓库里没有对应渲染器，放进去只会看到源码。
- 伪代码两种写法等价：

  ````md
  ::: pseudocode
  \begin{algorithm}
  \begin{algorithmic}
  \STATE $dis(v) = dis(u) + w(u,v)$
  \IF{...}
  \ENDIF
  \end{algorithmic}
  \end{algorithm}
  :::
  ````

  或 ```` ```pseudocode ```` fence 包同样的内容。语法是 pseudocode.js 的 LaTeX 子集
  （`\STATE`/`\IF`/`\FOR`/`\WHILE`/`\RETURN`…），**必须**被
  `\begin{algorithm}` + `\begin{algorithmic}` 包住，否则渲染失败并退化成一个 `<pre>`
  （同时打一条 warning）。伪代码内部的 `$…$` 交给 KaTeX，不算公式漏解析。

## 八、相关题解（自动生成，不要手写）

每篇正式文章的末尾都会自动追加一节：

```md
## 相关题解

| 题目 | OJ | 难度 |
| --- | --- | --- |
| [a^b](https://pcs2.roj.ac.cn/problems/roj/3000) | roj | 普及- |
```

- 数据来自 pcs2 题解仓库（`~/mycode/rbook_new_problem_solutions/problems`）里每道题
  frontmatter 的 `showAtRbook`，只取 `rbook1:<文章 id>` 形式的引用。写法见
  `rbook_new_problem_solutions/.agents/skills/oj-show-at-rbook`。
- 排序按 pcs2 的 `lib/difficulty.json`（由易到难，未知排最后）。
- 没有任何关联题解时，仍会显示标题和「暂无相关题解」。
- 不想出现在某篇文章里：在该文章 front matter 的 `rbook:` 下写 `practice: false`
  （附录类、与 OJ 无关的文章适合关掉）。
- **`+p THIS_ID` 方言已删除**，不要再写；写了会当普通文字输出。

## 九、图片与资产

- 相对路径 `![说明](./images/simple_path.svg)`；构建时 `bin/copy_images.sh` 会把
  png/jpg/jpeg/gif/bmp/svg 复制到 dist 对应目录。
- `xxx.excalidraw.svg` 会被包装成"图片 + Open in Excalidraw 按钮"。
- 需要额外拷进 dist 的资产（如 `.py`、`.sh`、PDF）写进 config 的 `copy` 数组。
- 原生 HTML 可以直接写（markdown-it `html: true`），例如
  `<video src="/video/x.mp4" controls></video>`、`<kbd>`、`<mark>`、`<ins>`、`<details>`。
- **EJS 宏已废弃且实际上已经坏了**：`<%= video('x') %>`、`<%= dvideo('x') %>`、
  `<%= iframe(url, h) %>`、`<%= pid_to_url(...) %>` 仍会被求值，产生一条"EJS 内容宏已弃用"警告，
  但返回的 HTML 会被当成普通文字转义输出（页面上看到 `<video …>` 字样）。
  一律改用原生 HTML 或 `[[[p: …]]]`；目前 `book/` 下已没有任何 EJS 用法。

## 十、看起来能写、其实不支持的（重点）

| 你会想写 | 实际结果 | 正确做法 |
|---|---|---|
| `[[dijkstra]]`、`[[a\|别名]]` | 双链不存在，原样输出 | `[[[rbook: dijkstra]]]` |
| `` `[[[rbook: x]]]` ``（反引号包住） | 变成代码里的字面量 | 去掉反引号 |
| `++插入文字++` | 纯文本 | `<ins>…</ins>` |
| `==高亮==` | 纯文本 | `<mark>…</mark>` |
| 脚注 `[^1]` + `[^1]: 说明` | 变成指向说明文字的怪链接 | 直接写正文或括注 |
| 任务列表 `- [ ]` | 普通列表项字面量 | 用 emoji 或纯文字 |
| `:smile:` 短码 | 字面量 | 直接打 emoji 😄 |
| ` ```cpp [g1:] ` | 标签为空，标记被丢弃，退化成普通代码块 | 补上标签名：`[g1:C++]` |
| 同组 fence 中间夹段落 | 各自成组（两个单标签组） | 删掉中间内容，让它们相邻 |
| `::: center`、`::: line`、`::: oneline`、`::: tip`、`::: info` | 原样输出（并给一条 `containers` 诊断） | 不加容器，或自己写 HTML；贴士类用 `::: note … icon=bulb` |
| `[[[demo: x]]]` | 未知指令，原样输出 | 用 `[[[dsa: x]]]`（外链卡片）或 `[[[animate: ./x.animation.ts]]]`（内嵌） |

## 十一、在示例里展示这些指令（逐个看，它们不一样）

| 指令 | 在围栏/行内代码里 | 写示例时要转义？ |
|---|---|---|
| `[[[include:]]]` | **会被展开** | 要 |
| `[[[animate:]]]` | **会被展开** | 要 |
| EJS 宏 | **会被展开** | 要 |
| `[[[dsa:]]]` | 保持原文 | 不要 |
| `[[[rbook:]]]` / `[[[p:]]]` | 保持原文（行内规则） | 不要 |

include / animate / EJS 都是**解析前**的块级预处理，写进 fence 也会被展开。
想展示它们，只能在 `[` 前加反斜杠：

```md
\[\[\[include: ./x.md]]]
\[\[\[animate: ./a.animation.ts]]]
```

⚠️ 但要知道：**围栏代码块里的反斜杠会原样显示**。上面那行在页面上看起来就是
`\[\[\[include: …]]]`（带反斜杠），而不是干净的 `[[[include: …]]]`。
这是当前实现的限制，不是写法错。要展示干净形式，只能用下面两种办法：

- 换成 `[[[dsa:]]]` / `[[[rbook:]]]` 这类**不展开**的指令做示例；
- 或者在行内代码里写（行内代码中反斜杠也会保留，同样不干净）。

所以最优解往往是：**不要在文章里教学 include/animate 的写法**；要教就指向
`docs/interactive-animation.md` 这类不进入发布产物的文件（`docs/` 不在 catalog 里，
不会被渲染）。

行内：`\[\[\[rbook: dijkstra]]]` 会输出字面量 `[[[rbook: dijkstra]]]`（同样带反斜杠）。

注意一个反直觉的细节：**单靠反引号包住不能保住 include/动画指令**（它们是解析前的预处理，
`` `[[[include: ./x.md]]]` `` 会先被展开成 HTML 再塞进行内代码）。

而 `[[[dsa:]]]`、`[[[rbook: id]]]`、`[[[p: …]]]` 在 fence 里本来就安全，不需要转义。
（`[[[dsa:]]]` 是插件自己屏蔽了代码段；另外两个走的是行内规则，时机在 tokenize 之后。）
已经验证过的组合：

| 围栏内写法 | 结果 |
|---|---|
| `[[[animate: ./x.ts]]]` | 变成 `动画加载失败` 错误框 |
| `\[\[\[animate: ./x.ts]]]` | 原文，**但带反斜杠** |
| `[[[include: ./x.md]]]` | 变成 `include 失败` 标记 |
| `\[\[\[include: ./x.md]]]` | 原文，**但带反斜杠** |
| `[[[dsa: spfa]]]` | 原文，干净 |
| `[[[rbook: spfa]]]`、`[[[p: …]]]` | 原文，干净 |

## 十二、验证：跑真实渲染器，而不是靠预览

```bash
npm run prepare    # 生成 .tsbuild；首次或改过 src/publishing 后必须执行
node .agents/skills/rbook-markdown/scripts/render-check.js graph/bellman-ford
node .agents/skills/rbook-markdown/scripts/render-check.js graph/spfa/index.md --html
```

脚本用**项目真实管线**（catalog + 文章 config + 全部插件）渲染指定文章，然后分两层体检：

- **源码层**（先剥掉围栏与行内代码，所以正确转义过的示例不会被误报）：
  未知的 `[[[type: …]]]`、双方括号、未注册的 `:::` 名字、`++`/`==`/脚注/`[g1:]` 空标签；
- **产物层**：`include-missing`、`rbook-animation--error`、`rbook-dsa-card--error`、`extra-link missing`。

命中位置会给出源码行号，末尾打印全部诊断（含建议）。加 `--html` 可打印正文 HTML。
退出码 0 = 干净，1 = 有残留或 error 级诊断，2 = 用法或环境错误。

其它校验：

```bash
npm run check:catalog   # 菜单是否可达、孤儿文章、config 是否合法
npm run dev             # 本地预览；改 md / animation.ts 会整页刷新
```

改完内容一定要看诊断里的 `latex` 条目：公式漏解析是本项目最常见的静默失效。

## 附录：实现位置（要改方言时看这里）

- 插件注册顺序：`src/publishing/markdown/plugin-registry.ts`
- 站内 / 题目链接：`plugins/rbook-link.ts`（只认**三方**括号，单/双方括号完全不参与解析）
- include 与 `file=`：`plugins/include.ts`
- 内嵌动画：`plugins/animate.ts`
- 外链动画卡片：`plugins/dsa.ts` + `book/demos.json`（生成物）+ `scripts/sync-demos.mjs`
- 卡片样式与水果字体码点表：`src/markdown-style/dsa-card.scss`、`src/public/fonts/`
- 容器：`plugins/containers.ts`（kind 表与参数解析都在这里；未注册的名字会原样输出并给一条 `containers` 诊断）
- 伪代码：`plugins/pseudocode.ts`、`plugins/fence.ts`
- 代码标签页：`plugins/code-tabs.ts`（分组）+ `plugins/fence.ts`（包面板）+ `src/markdown-style/codetabs.scss`
- 数学：`plugins/math.ts`（内含"公式漏解析"的两类检测）
- TOC 与锚点：`plugins/toc.ts`
- 文章元数据：`content/metadata-normalizer.ts`、`content/config-loader.ts`
- 路径与发布 href：`content/path-policy.ts`
