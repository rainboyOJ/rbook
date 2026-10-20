---
name: rbook-markdown
description: 编写或修改 /home/rainboy/mycode/newRbook_ejs 这本 rbook 电子书里的 Markdown 时必须遵守的方言说明（站内链接 [[[rbook:]]]、题目链接 [[[p:]]]、include 与 file=、animate、数学、::: 容器、伪代码、题目列表 +p、catalog/config 元数据，以及哪些"通用 Markdown 语法"在本项目其实会静默失效）。当你在 book/ 下新建或编辑任何 .md（index.md、practice.md、teach_plan.md、problem.md…）、调整 book/catalog.yaml 或文章的 config.json/config.yaml、修一个链接/代码块/图片/公式/折叠框渲染不对、把别处的 Markdown 搬进来、或者要判断"这段写法本项目支持吗"时，都应先读这个 skill，不要凭 GitHub / Obsidian / VuePress 的语法直觉下手。
---

# rbook 的 Markdown 方言

这份文档只讲**本项目的方言**：它在 markdown-it 之上装了一批自定义插件
（`src/publishing/markdown/plugin-registry.ts`）。通用 CommonMark 部分不再赘述。

动手前先建立三个判断，它们决定了这个仓库的坑长什么样：

1. **不少方言是"块级预处理"，跑在 Markdown 解析之前**
   （`[[[include:]]]`、`[[[animate:]]]`、EJS 宏都挂在 `core.ruler` 的 `normalize` 之前）。
   所以它们**在代码围栏里也会展开**——想在示例里展示指令，必须转义。
2. **绝大多数失效是静默的**：未注册的 `:::` 名变成普通段落、`[g1:cpp]` 被丢弃、
   `[[wikilink]]` 原样输出、`++插入++` 只是文本。不报错，只是"没效果"。
3. **判断"到底生效了没有"的唯一可靠办法是跑真实渲染器**，本 skill 带了一个脚本（见文末）。

## 一、文章骨架（先有元数据，再有正文）

```
book/<章>/<文章目录>/
├── index.md          # 正文；文件名由 config 的 file 字段指定
├── config.json       # 或 config.jsonc / config.yaml / config.yml（按此优先级取一个）
├── images/           # 相对 index.md 引用的图片
└── xxx.animation.ts  # 可选：交互动画入口
```

- **菜单与 id 的唯一真相是 `book/catalog.yaml`**。文章目录必须在那里登记，
  否则 `npm run check:catalog` 会判为孤儿（写了但永远不会发布）。
- `config.json` 关键字段：

  ```json
  {
    "id": "bellman-ford",
    "file": "index.md",
    "title": "bellman-ford",
    "pre": ["dijkstra"],
    "teach_plan": "teach_plan.md",
    "copy": ["assets/a.png"],
    "code_template": [{ "title": "Bellman-Ford 最短路", "code": "./bellman_ford.cpp" }]
  }
  ```

  `id` 是 `[[[rbook: id]]]` 的唯一键；缺省时由路径推导（`index.md` 用目录名，其它用文件名）。
  `copy` 里的文件会在构建时复制到该文章的 dist 目录。
- 正文顶部 `---\ntitle: …\n---` front matter **只被读取 title**，是标题的兜底；
  正常元数据仍写在 config 里。
- 正文第一行惯例写 `[[TOC]]`（也认 `[TOC]`、`[[toc]]`、`[[Toc]]`），在该位置渲染页内目录
  `<nav class="table-of-contents">`，只收 h2/h3。没有这个占位符就没有页内目录
  （侧边栏菜单来自 catalog，与此无关）。

## 二、站内与题目链接

| 写法 | 用途 |
|---|---|
| `[[[rbook: article_id]]]` | 链接到书内文章（带 rbook 图标的按钮） |
| `[[[p: luogu-P1048]]]` | 链接到题目 |
| `[[[p: luogu-P1048 \| 采药]]]` | 同题，强制显示指定标题 |

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

## 四、交互动画

```md
[[[animate: ./dijkstra.animation.ts]]]
```

- 目标必须是 `.animation.ts`、位于 `book/` 内、文件必须存在，否则页面显示
  `动画加载失败: …`。`mount(context)` 的约定见 `docs/interactive-animation.md`。
- 路径同样相对当前 md 文件；写在被 include 的片段里则相对片段自身。

## 五、数学

- 行内 `$a^2+b^2=c^2$`；块级 `$$ … $$`；也支持 ```` ```math ```` fence（KaTeX displayMode）。
- 后端是 markdown-it-texmath（`delimiters: 'dollars'`），有两条**硬性格式要求**，
  不满足时公式会静默变成字面文本（构建期给 warning，不抛错）：
  - 开 `$` 之后、闭 `$` 之前**不能紧贴空白**：写 `$a$`，不要 `$ a $`；
  - `$$` 块内部**不能再出现 `$`**，且闭合 `$$` 前不能是反斜杠。
- `\R` 被预置为 `\mathbb{R}`。
- 行内代码里的 `$` 不受影响（`\`$notmath$\`` 保持原样）。

## 六、容器（`:::`）

只认下面这几个名字，**其余名字会原样输出成文字**，且不会有任何提示：

| 名字 | 效果 | 名字后能跟文字吗 |
|---|---|---|
| `::: fold` | `<details>` 折叠，summary 固定是"点击" | 能，但文字会被丢掉 |
| `::: colorfulbox` | 浅色底盒子 | **不能**（validation 要求整行只有名字） |
| `::: oneWordAlgo` | "一句话算法"标题块 | **不能**（同上） |
| `::: blackboard` | 黑板样式 | 能（被忽略） |
| `::: info` / `::: warning` / `::: error` | 带图标的提示框 | 能（被忽略） |
| `::: pseudocode` | 伪代码块（见下节） | 不能，且 `:::` 与名字之间**必须有空格** |

- `:::` 收尾必须是**单独一行** `:::`。`:::name`（无空格）对 `info`/`fold`/`colorfulbox` 等仍然有效，
  但 `:::pseudocode` 不行。
- **不支持嵌套**：内层容器的收尾会提前结束外层，剩下的 `:::` 变成正文。
- 仓库里还散落着 `::: center`、`::: line`、`::: oneline` —— 这些**没有注册**，实际是原样输出的文字。
  新内容不要再用。

## 七、代码块与伪代码

- 普通代码块走 Prism 高亮 + 行号列 + 复制按钮。别名：`c++`→cpp、`py`/`python3`→python、
  `js`、`ts`、`sh`/`shell`/`zsh`→bash、`yml`。未收录语言会自动尝试加载，失败退化为纯文本。
- 特殊语言名：`mermaid`（前端 CDN 渲染）、`pseudocode`、`math`、`plantuml`、`dot`。
  ⚠️ `plantuml` 与 `dot` 目前**只输出 `<pre>`**，仓库里没有对应渲染器，放进去只会看到源码。
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

## 八、题目列表

```md
+p THIS_ID
```

- 必须**单独成行**（行首 `+p `）。`THIS_ID` 会替换成当前文章 id，也可以写具体 id。
- 数据来自题库 provider 的 `getProblemsForArticle(id)`；未配置或没数据时渲染"暂无题目"。

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
| ` ```cpp [g1:cpp] ` | `[g1:…]` 被静默忽略，各块独立显示 | 拆成多个 fence，或用 `file=` |
| `::: center`、`::: line`、`::: oneline` | 原样输出 | 不加容器，或自己写 HTML |

## 十一、在示例里展示这些指令

因为 include / animate / EJS 都是**解析前**的块级预处理，写进 fence 也会被展开。
用反斜杠转义 `[[`：

```md
\[\[\[include: ./x.md]]]
\[\[\[animate: ./a.animation.ts]]]
```

行内同理：`\[\[\[rbook: dijkstra]]]` 会输出字面量 `[[[rbook: dijkstra]]]`。

注意一个反直觉的细节：**单靠反引号包住不能保住 include/动画指令**（它们是解析前的预处理，
`` `[[[include: ./x.md]]]` `` 会先被展开成 HTML 再塞进行内代码）。所以：

- 要写进**行内代码**给人看：反引号 + 反斜杠转义一起用，即 `` `\[\[\[include: ./x.md]]]` ``；
- 要写进**围栏代码块**给人看：把整个围栏标成 `md`/`text` 也躲不掉，同样要写成 `\[\[\[…]]]`。

`[[[rbook: id]]]` 和 `[[[p: …]]]` 走的是行内规则，在 fence 里本来就安全，不需要转义。

## 十二、验证：跑真实渲染器，而不是靠预览

```bash
npm run prepare    # 生成 .tsbuild；首次或改过 src/publishing 后必须执行
node .agents/skills/rbook-markdown/scripts/render-check.js graph/bellman-ford
node .agents/skills/rbook-markdown/scripts/render-check.js graph/spfa/index.md --html
```

脚本用**项目真实管线**（catalog + 文章 config + 全部插件）渲染指定文章，然后分两层体检：

- **源码层**（先剥掉围栏与行内代码，所以正确转义过的示例不会被误报）：
  未知的 `[[[type: …]]]`、双方括号、未注册的 `:::` 名字、`++`/`==`/脚注/`[g1:]`；
- **产物层**：`include-missing`、`rbook-animation--error`、`extra-link missing`。

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
- 动画：`plugins/animate.ts`
- 容器：`plugins/containers.ts`（未注册的名字不会有任何提示）
- 伪代码：`plugins/pseudocode.ts`、`plugins/fence.ts`
- 数学：`plugins/math.ts`（内含"公式漏解析"的两类检测）
- 题目列表：`plugins/problem-list.ts`
- TOC 与锚点：`plugins/toc.ts`
- 文章元数据：`content/metadata-normalizer.ts`、`content/config-loader.ts`
- 路径与发布 href：`content/path-policy.ts`
