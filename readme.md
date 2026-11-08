
一个纯静态的rbook,一切以简单为本,遵循KISS原则

在线地址: https://rbook.roj.ac.cn

使用的技术

- ejs (页面模板)
- markdown-it (渲染核心)
- TypeScript (新发布管线 `src/publishing/`)
- asymptote
- graphviz
- scss
- vite 打包 (站点壳)
- bun (包管理)

## 快速开始

```bash
bun install              # 安装依赖 (自动编译 src/publishing)
bun run typecheck        # TypeScript 类型检查
bun test                 # 运行测试
bun run dev              # 开发模式 (站点壳)
```

## 发布命令

```bash
rbook catalog validate    # 校验目录清单与配置
rbook render <id-or-path> # 渲染单篇文章
rbook render-all          # 渲染全部文章
rbook diagnostics         # 全量诊断，不写盘
rbook build --profile core  # 核心构建 (不含第三方资产)
rbook build --profile full  # 完整构建 (含动画、论文、third_part)
```

## 对外文章清单 `dist/catalog.json`

本站是纯静态站，没有 REST 接口。构建时多写一个 `dist/catalog.json`，nginx 当普通静态
文件托管，供其他项目按 **文章 id** 引用本站文章（现在是
`rbook_new_problem_solutions` 的题解 frontmatter）。

```json
{
  "site": "rbook1",
  "generatedAt": "2026-11-05T06:41:39.240Z",
  "total": 134,
  "items": [{ "id": "presum", "title": "前缀和", "url": "/base/presum/index.html" }]
}
```

约束：

- **`site` 是站点短名。** `rbook1` = 本站 (`rbook.roj.ac.cn`)，`rbook2` =
  `rbook_nunjucks` (`rbook2.roj.ac.cn`)。两本书存在同名 id，所以使用方要拼成
  `rbook1:<id>` 才能唯一定位；本文件里的 `id` 保持裸值。
- **`url` 必须是站内根相对路径**（以 `/` 开头、不以 `//` 开头），使用方不接受绝对域名。
- **`id` 必须唯一**。重复会让一个 id 指向两篇文章，所以构建直接失败
  （`tests/catalog-manifest.test.js` 盯这条）。
- id 来自文章 md 的 front matter 里 `rbook.id`，没写时由目录名/文件名推导；标题按
  `front matter title → catalog.yaml title` 解析（侧边栏另有短名 `menu_title`，
  见 `docs/adr/0012-dual-track-article-titles.md` 与 `docs/adr/0013-metadata-in-front-matter.md`）。
- 只收录**能从 catalog.yaml 解析出真实 URL** 的文章。写了 config 但不在 catalog 里的
  目录会以 warning 列出来，不进入清单（有 id 却点不进去的链接比没有链接更糟）。

## 文件

```
.
├── bin                 可执行脚本 (旧管线 shim，迁移完成后删除)
├── src
│   ├── publishing      新发布核心 (TypeScript, 编译产物在 .tsbuild/)
│   ├── ejs             页面模板
│   └── markdown-style  markdown 样式
├── book                书的 md 源文件
│   └── catalog.yaml    目录清单 (显式编排；hidden: true = 构建并发布，但不进侧边栏)
├── dist                构建产物 (gitignore)
├── .tsbuild            TS 编译产物 (gitignore)
├── tests               测试与发布契约 fixture
├── docs                重构计划、ADR、dist 结构基线
├── scripts             一次性工具脚本
├── images              Asymptote 图
├── manimce             动画
├── third_part          第三方页面
├── algo_template       算法代码模板
├── assets              论文等资产
├── tsconfig.json
└── vite.config.js
```

## markdown 语法

### 题目列表

```
+p THIS_ID
```

从roj里找所有`solutions/*md`文件里含有`practice_rbook: THIS_ID`的problems列表

### 链接

```
[[[rbook: article_id]]]       # 链接到书内文章
[[[p: luogu-1001]]]           # 链接到题目
```

### 多语言 code tab

相邻的两个及以上 fence，在 info 里写 `[分组名:标签名]` 即合成一组标签页；
分组名不同、或中间隔着其它内容就各自成组。面板显隐是纯 CSS，没有 JS 也能切换，
打印时会展开全部版本。实现见 `src/publishing/markdown/plugins/code-tabs.ts`。

```
\`\`\`js [g1:JavaScript]
console.log("hello");
\`\`\`

\`\`\`py [g1:Python3]
print("hello")
\`\`\`
```

### markdown-it container

```
::: fold       折叠

:::

::: center     居中

:::

::: oneWordAlgo   一句话算法

:::

::: colorfulbox   彩色盒子

:::

::: blackboard    黑板

:::
```

伪代码 语法: https://github.com/tatetian/pseudocode.js

```
::: pseudocode
:::
```

### excalidraw 点击打开
excalidraw 导出图片时,选择,保留数据

`![](1.excalidraw.svg)` 这样的图片会被渲染成

```

  open in excalidraw
+--------------------+
|   image
+--------------------+
```

点击后`open in excalidraw`,可以在excalidraw 里打开,可以进行修改

## TODO

- functional programming
  - https://github.com/gcanti/fp-ts
- 新功能 markdown 扩展
  - https://github.com/antfu/markdown-it-github-alerts

## 参考

- http://css.doyoe.com 参考样式

## 感谢

- [dashroshanvisits-counter 🔢 Customizable SVG visits counter badge](https://github.com/dashroshan/visits-counter)
