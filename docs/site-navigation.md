# 站点导航架构

Rbook 的文章使用真实的静态页面地址导航。每篇文章生成完整的站点布局，页面自身包含左侧目录和右侧文章内容，因此文章之间不再通过首页 iframe 切换。

## 状态职责

导航状态分为三类：

```text
URL pathname
    当前文章，例如 /recursion/binary_search/index.html

localStorage
    用户展开了哪些目录

文章自身
    标题锚点、动画播放进度和文章内部滚动位置
```

当前文章由 `location.pathname` 判断。目录展开状态保存在 `rbook.sidebar.expanded.v1`，这样用户从一篇文章跳到另一篇文章时，目录仍保持熟悉的展开状态。文章链接使用普通 `<a>`，浏览器的前进、后退、刷新、复制链接和新标签页都按照标准行为工作。

## 渲染流程

发布阶段先从 `catalog.yaml` 解析所有叶子文章，并通过 `PathPolicy` 得到每篇文章最终的发布 URL。`MenuRenderer` 接收这个映射后生成目录 HTML，`PageTemplateRenderer` 把目录注入 `article.html`：

```text
catalog.yaml
    ↓
resolveArticleSource + PathPolicy
    ↓
catalog path -> /chapter/article/index.html
    ↓
MenuRenderer
    ↓
article.html = sidebar + article content
```

目录文件节点是普通链接，目录节点是带 `aria-expanded` 的按钮。`/js/site-shell.js` 只负责移动端目录开关、目录展开持久化和当前文章高亮，不负责文章跳转。

## 为什么不再使用 iframe

iframe 曾经让目录停留在父页面，但也把导航拆成两个文档：父页面管理 hash，文章页面管理自己的链接。结果是 URL 不自然，文章内部链接会只改变 iframe，浏览器历史也无法准确表达用户阅读路径。

现在每篇文章都复用同一套布局。文章内部链接和目录链接拥有相同的导航语义，交互动画仍然在文章页面中运行；文章内部需要隔离的第三方页面仍可以继续使用普通 iframe。

## 新增页面时的约束

- 在 `catalog.yaml` 中登记文章，让构建阶段生成真实发布链接。
- 文章内部使用普通 Markdown 链接，不写 `#` 路由。
- 目录展开交互写在 `src/public/js/site-shell.js`，不要在文章 Markdown 中操作全局目录。
- 站点布局样式使用 `.rbook-*` 命名空间，文章正文样式继续使用 `.markdown-body`。
