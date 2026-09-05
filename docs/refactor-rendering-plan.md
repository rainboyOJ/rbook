# Rbook 渲染与发布重构计划

本计划供 Luna 执行。目标是整理当前电子书项目的内容、目录、渲染、模板和发布边界，同时保持第一阶段的线上兼容性。

## 1. 基线与范围

### 已确认的约束

- 保留现有文章 URL、目录路径、Markdown 扩展语法和主要生成结果。
- 目录由显式目录清单维护；文章元数据与目录编排分离。
- 渲染核心使用标准 `markdown-it`，旧内容宏保留为隔离的兼容层并标记弃用。
- 站点壳继续使用 Vite/EJS 和 iframe/hash 导航；不在本轮改成 SPA、Vue 或 Nunjucks。
- 新发布核心使用 TypeScript/ESM；旧 JS 插件通过适配器逐步迁移。
- LokiJS 不再是构建前置数据库；题库通过可注入的 `ProblemProvider` 接入。
- 构建分为 `core` 和 `full` profile；旧 `build.sh` 过渡保留。
- 新旧管线并行迁移，先样板、后分批、最后删除旧实现。

### 当前事实

- [src/menu.js](/home/rainboy/mycode/RBOOK系列/newRbook_ejs/src/menu.js:9) 同时保存手工目录、生成菜单 HTML 和展开文章清单。
- [src/md_info.js](/home/rainboy/mycode/RBOOK系列/newRbook_ejs/src/md_info.js:10) 同时负责路径推导、配置加载、原文读取、输出路径和 Git 地址。
- [bin/render_markdown.js](/home/rainboy/mycode/RBOOK系列/newRbook_ejs/bin/render_markdown.js:39) 同时负责读取原文、组装 EJS locals、调用 Markdown、教学计划递归渲染、写 HTML 和复制附件。
- [bin/markdown-it.js](/home/rainboy/mycode/RBOOK系列/newRbook_ejs/bin/markdown-it.js:1) 依赖未在 `package.json` 声明的 `markdown-r`，并把文件路径写入全局可变 `md.env`。
- [bin/rbook.js](/home/rainboy/mycode/RBOOK系列/newRbook_ejs/bin/rbook.js:16) 加载 LokiJS 和仓库外的 `../problems`，且 `db update` 不清空旧集合。
- [build.sh](/home/rainboy/mycode/RBOOK系列/newRbook_ejs/build.sh:1) 把 Vite、文章渲染、Sass、Asymptote、第三方页面、论文资产和 Manim 串成一条无阶段边界的脚本。
- 当前约有 360 个书内文件、111 个配置文件；配置同时使用 JSONC/JSON 和 YAML，并存在字段拼写漂移。
- 当前仓库没有项目级测试命令，工作区也不能假定已经安装依赖；依赖清单与安装方式必须先恢复为可重复状态。

### 非目标

- 不在第一阶段重写或润色全部文章。
- 不把所有 sidecar 配置一次性迁入 Markdown front matter。
- 不重构 `third_part`、`canvas`、`manimce` 内部实现。
- 不重做首页 UI、iframe/hash 导航或样式主题。
- 不一次性迁移所有 JS/TS 文件，不做无关格式化。

## 2. 目标领域模型

所有新代码围绕以下对象和边界组织，名称与 [CONTEXT.md](/home/rainboy/mycode/RBOOK系列/newRbook_ejs/CONTEXT.md) 保持一致：

| 对象 | 责任 | 不负责 |
| --- | --- | --- |
| `Catalog` | 目录清单的层级、顺序、分组、导航显示名和文章引用 | 解析 Markdown、读题库、写 HTML |
| `ArticleSource` | 一篇文章的源路径、原文和旁车资源定位 | 目录排序、HTML 模板 |
| `ArticleMetadata` | 规范化后的 id、标题、文件、关系、附件和渲染选项 | 生成菜单 HTML |
| `ArticleIndex` | 按 id、源路径和发布路径查找文章 | 读取 LokiJS、访问题库 |
| `RenderContext` | 单篇渲染所需的源路径、文章索引、题库、宏和运行选项 | 跨文章共享可变状态 |
| `ArticleView` | 页面模板需要的标题、链接、徽章、正文和附加信息 | 文件系统、数据库对象 |
| `ProblemProvider` | 查询题目、题解和题目链接 | 维护 Rbook 文章目录 |
| `Diagnostic` | 结构化记录阶段、文章、位置、原因和建议 | 静默吞掉错误 |
| `PublishProfile` | 声明要执行的发布阶段和外部工具依赖 | 改变文章内容语义 |

目标数据流：

```text
catalog.yaml + article config
        -> catalog loader / metadata normalizer
        -> ArticleIndex
        -> ArticleSource resolver
        -> compatibility macros
        -> markdown-it + registered plugins
        -> ArticleView
        -> EJS PageTemplateRenderer
        -> HTML/artifact writer
        -> publish profile asset stages
```

单篇渲染必须是显式输入/输出：

```text
renderArticle(source, { metadata, index, problemProvider, options })
  -> { view, html, copiedArtifacts, diagnostics }
```

不得通过模块级 singleton、全局 `md.env`、隐式 cwd 或 EJS 中的数据库对象传递上下文。

## 3. 目标目录与模块责任

先在当前仓库内建立边界，不立即拆成多个 npm 仓库：

```text
src/publishing/
  domain/
    catalog.ts
    article.ts
    metadata.ts
    index.ts
    diagnostics.ts
  content/
    catalog-loader.ts
    config-loader.ts
    metadata-normalizer.ts
    source-resolver.ts
    path-policy.ts
  markdown/
    create-markdown-renderer.ts
    plugin-registry.ts
    plugins/
      content-macros.ts
      problem-list.ts
      rbook-link.ts
      containers.ts
      fence.ts
      excalidraw.ts
      pseudocode.ts
    compatibility/
      markdown-r-adapter.ts
  templates/
    page-template-renderer.ts
    article-view.ts
  pipeline/
    render-article.ts
    render-many.ts
    artifact-writer.ts
  integrations/
    problem-provider.ts
    optional-problem-provider.ts
  build/
    stages.ts
    profiles.ts
    diagnostics-reporter.ts
  cli/
    commands.ts
```

迁移期间保留这些兼容入口：

- `bin/rbook.js` 变成 CLI shim，只转发到编译后的 `src/publishing/cli`。
- `bin/render_markdown.js` 变成旧 API shim，内部调用 `renderArticle`，全量切换后删除。
- `bin/markdown-it.js` 变成兼容导出，不能继续承载插件注册和全局配置。
- `src/ejs/**` 保留模板文件；模板只接收 `ArticleView`。
- `src/app.js`、`src/index.html` 第一阶段只做必要的菜单数据接入，不改 iframe/hash 行为。
- `src/markdown-style/**` 的样式可保留，但 JS 插件实现和 CSS 归属要在计划目录中一一对应。

## 4. 分阶段执行

### Phase 0：恢复可重复基线

1. 选择并记录唯一包管理方式。当前仓库有 `yarn.lock` 和 `packageManager` 声明；使用 Corepack/Yarn，或明确迁移到 npm 并只保留一种 lockfile。
2. 盘点所有运行时 import。补齐真正需要的直接依赖，删除未使用依赖；特别检查 `markdown-r`、`markdown-it`、`jsonc-parser`、`js-yaml`、`twemoji`、伪代码插件和 Sass 入口。
3. 修复 `src/markdown-style/markdown.scss` 对未声明 `markdown-r/assets/markdown-r.scss` 的依赖：要么明确 vendor 固定资产，要么替换为项目拥有的样式入口。
4. 建立 `tsconfig`、TypeScript 编译命令和 `node:test` 测试命令。编译产物放在静态 `dist/` 之外的临时/构建目录。
5. 记录现有 `dist`（若可用）的文章清单和代表性 HTML；若旧 `markdown-r` 无法恢复，记录为“结构基线”，不要伪造字节级快照。

**退出条件**：干净环境可以安装依赖；`typecheck`、单个 CLI help 和现有 Vite shell build 可运行；当前未修改文章内容。

### Phase 1：冻结发布契约与测试夹具

建立 `tests/fixtures/markdown/`，至少覆盖：

- 普通标题、列表、表格、代码块和数学公式；
- `+p THIS_ID` 与题目列表；
- `[[[rbook:...]]]`、`[[[p:...]]]`、找不到目标的情况；
- `fold`、`colorfulbox`、`oneWordAlgo`、默认提示容器和 blackboard；
- code tabs、伪代码、Mermaid/PlantUML/DOT fence；
- `.excalidraw.svg` 相对路径；
- EJS 内容宏、`video`、`iframe`、`teach_plan` 和附件复制；
- 缺失 config、坏 JSONC/YAML、缺失附件和重复 id。

快照不要直接包含动态访问计数、绝对路径和时间；通过 normalizer 处理动态字段，并额外做关键 HTML 标记断言。保存旧实现/当前产物与新实现的结构化 diff。

**退出条件**：代表性 fixture 可重复运行；失败信息能指出阶段、文章 id 和源路径；CI 可在没有外部题库时运行不依赖题库的 fixture。

### Phase 2：建立内容与目录模型

1. 从 `src/menu.js` 的人工编排机械转换出 `book/catalog.yaml`，先保持现有顺序、路径、显示名和叶子文章集合。
2. `CatalogLoader` 只读取清单并校验：重复引用、循环层级、空标题、未知文章和重复导航 id 都生成诊断。
3. `ConfigLoader` 支持 JSONC/JSON/YAML；`MetadataNormalizer` 将旧字段映射到 `ArticleMetadata`，例如 `hiden_*`、`hidden_*`、`teach_plain`/`teach_plan`，并对别名发 warning。
4. 对缺少 sidecar 配置的 Markdown 生成默认元数据，不在本阶段写回所有文章目录。
5. 实现统一 `PathPolicy`：源路径、相对路径、发布 href、输出路径、Git URL 都从 project root 计算，禁止硬编码 `/home/rainboy/...`。
6. 从目录和元数据生成 `ArticleIndex`；先内存使用，必要时再生成确定性 JSON artifact，不引入 LokiJS。

**退出条件**：新索引的文章数量、id 集合、发布 href 与旧清单一致；导航 HTML 可以由 Catalog 派生；`src/menu.js` 不再被渲染核心依赖。

### Phase 3：重建 Markdown 渲染核心

1. 使用标准 `markdown-it` 创建 `createMarkdownRenderer(options)`，每次渲染通过 `md.render(source, env)` 传入独立 env。
2. 将插件分为四类并建立显式注册顺序：标准语法、Rbook 内容扩展、外部集成、输出后处理。
3. 把 `bin/triple-square-brackets` 和 `bin/problem_list` 迁入 `src/publishing/markdown/plugins/`，渲染函数只依赖接口，不依赖 LokiJS 或外部类的具体实现。
4. 把 fence、container、伪代码、Excalidraw 的现有行为迁入独立插件；每个插件有自己的 fixture 和错误诊断。
5. 旧 EJS 内容宏作为预处理/兼容插件接入，限制可用 locals 和相对文件访问；输出 deprecated warning，不在插件中写文件。
6. `ProblemProvider` 未配置时：不依赖题库的文章正常渲染；依赖题库的语法生成可定位的 error/warning，不访问仓库外固定路径。
7. 先运行新旧 renderer 双写或双渲染，对 fixture 做结构化比较；确认后再让新 renderer 成为默认入口。

**退出条件**：Phase 1 fixture 通过；同一渲染器可安全连续渲染多篇文章；不再修改模块级 `md.env`；`markdown-r` 不再是运行时依赖。

### Phase 4：拆分文章渲染与模板写盘

把原 [bin/render_markdown.js](/home/rainboy/mycode/RBOOK系列/newRbook_ejs/bin/render_markdown.js:39) 拆为明确步骤：

1. `loadArticleSource`：读取原文和 sidecar metadata。
2. `renderMarkdown`：返回正文和 header/TOC 等结构化结果。
3. `buildArticleView`：只组装模板所需的稳定链接、徽章、教学计划链接和正文。
4. `PageTemplateRenderer`：调用 EJS 模板，禁止模板直接读取文件或查询索引。
5. `ArtifactWriter`：安全创建输出目录、写 HTML、复制声明的附件并检查源文件存在。
6. `renderRelatedDocuments`：教学计划等关联文章显式进入任务图，禁止在模板函数中隐式递归。

模板输入应有单独类型/运行时校验；`pid_to_url`、`video`、`dvideo`、`iframe` 等宏只在兼容上下文中提供，不能散落在渲染流程主体。

**退出条件**：单篇 `render` 可测试；写盘失败不会留下“成功”状态；教学计划和附件行为与旧实现一致；模板不再接收 `rbookDB`、`problemDB` 或 `md_file` 内部对象。

### Phase 5：CLI 与构建阶段化

实现以下新命令，并保留旧命令别名到迁移完成：

```text
rbook catalog validate
rbook render <id-or-path>
rbook render-all
rbook build --profile core
rbook build --profile full
rbook diagnostics
```

构建阶段：

- `prepare-catalog`：读取清单、配置、生成索引和验证路径；
- `render-pages`：渲染文章与关联文档；
- `build-site-shell`：调用 Vite/EJS 生成首页和静态壳；
- `copy-assets`：复制书内图片、样式、固定公共资源；
- `build-optional-widgets`：执行第三方页面、Asymptote、论文和动画等外部步骤。

`core` 执行前三个阶段及文章渲染所需的最小 CSS；`full` 在 core 成功后执行可选资产。每个阶段报告输入、输出、外部命令和诊断。旧 `build.sh` 只负责调用 `rbook build --profile full`，不再自行拼接业务步骤。

**退出条件**：单阶段可独立重跑；`core` 不依赖第三方目录和外部题库；full profile 的失败能指向具体资产阶段；旧部署命令仍可用。

### Phase 6：批量迁移与清理

按以下批次启用新管线：

1. 普通 Markdown、标题、代码、公式；
2. containers、code tabs、伪代码和图示；
3. `+p`、三重方括号和题库 provider；
4. EJS 宏、教学计划和附件；
5. 全量文章及 full profile 资产。

每批都要：

- 生成文章清单和错误汇总；
- 对比输出路径、文章数量和关键 HTML 标记；
- 运行 fixture、单篇 smoke、全量 core build；
- 记录不兼容项，不直接修改正文来掩盖渲染器问题。

最后删除或归档：旧 `bin/markdown-it.js` 实现、LokiJS 数据库模块、`db update` 前置要求、仓库外硬编码路径和重复的菜单派生逻辑。旧 API shim 在至少一个完整发布周期稳定后再删除。

## 5. 验收命令与质量门槛

Luna 应补充统一脚本名，命令名可按实际工具调整，但语义必须覆盖：

```bash
npm run typecheck
npm test
npm run check:catalog
npm run render:fixture
npm run build:core
npm run build:full
```

质量门槛：

- 配置解析错误、重复 id、重复发布路径、缺失 source/attachment 必须非零退出；
- `render-all` 默认汇总所有文章错误后非零退出，`--lenient` 仅用于本地查看；
- fixture 不允许依赖在线访问计数或本机绝对路径；
- 新旧文章清单的差异必须显式列出；
- 任何迁移提交不得同时大规模改写文章内容和渲染器；
- 变更后的工作区不得生成未声明的临时产物，静态 `dist/` 与 TS 编译产物分开。

## 6. 风险与处理

| 风险 | 处理 |
| --- | --- |
| `markdown-r` 的真实行为和版本无法恢复 | 以当前 `dist`/代表性页面建立结构基线；把差异归因到具体插件，不伪造完整旧快照 |
| EJS 宏执行任意文件或依赖隐式 locals | 兼容层限制 locals、限定 root、记录 deprecated 诊断；迁移后删除 |
| 配置 JSONC/YAML 坏数据 | 先只读诊断和报告，提供迁移命令，不批量覆盖原文件 |
| `ProblemProvider` 或外部题库缺失 | 可选注入；core 对无题库文章可构建，对依赖项给出定位错误 |
| 绝对路径和相对图片路径差异 | 所有路径通过 `PathPolicy` 计算；为 Linux/CI 临时根目录写测试 |
| 旧输出包含动态远程资源 | snapshot normalizer 去除计数/时间，保留 URL 结构和 HTML 标记断言 |
| 第三方资产工具链不稳定 | 只放在 full profile；core 构建和渲染验证不被阻塞 |

## 7. 建议提交顺序

每个提交保持可运行、可回滚：

1. `chore: restore reproducible publishing toolchain`
2. `test: capture current rendering contract`
3. `refactor: introduce catalog and normalized metadata model`
4. `refactor: add article index and path policy`
5. `refactor: register standard markdown-it plugins`
6. `refactor: isolate legacy content macros`
7. `refactor: split article view, template rendering, and artifact writing`
8. `refactor: add injectable problem provider`
9. `refactor: add core and full publish profiles`
10. `migration: switch representative articles to new pipeline`
11. `migration: switch all articles and retain compatibility shims`
12. `cleanup: remove LokiJS and legacy renderer implementation`

禁止在同一提交中混合：目录大迁移、文章正文改写、插件重写和样式重排。

## 8. 给 Luna 的执行指令

从 Phase 0 开始，逐阶段执行；每阶段结束先运行退出条件中的命令，再进入下一阶段。优先保留兼容入口和回滚点，不要直接删除旧文件。遇到输出差异时，先新增 fixture 和诊断，定位到“目录、元数据、宏、Markdown 插件、模板、写盘、资产”中的一个边界，再修复。

每完成一个阶段，报告：

- 修改的模块和新增的边界；
- 通过/未通过的命令；
- 新旧输出差异数量及分类；
- 尚未迁移的插件、宏或文章；
- 是否满足该阶段退出条件。

只有 Phase 6 全量 core/full 验证通过后，才删除旧 renderer、LokiJS 和兼容 shim。
