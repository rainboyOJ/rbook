
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

## 文件

```
.
├── bin                 可执行脚本 (旧管线 shim，迁移完成后删除)
├── src
│   ├── publishing      新发布核心 (TypeScript, 编译产物在 .tsbuild/)
│   ├── ejs             页面模板
│   └── markdown-style  markdown 样式
├── book                书的 md 源文件
│   └── catalog.yaml    目录清单 (显式编排)
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
