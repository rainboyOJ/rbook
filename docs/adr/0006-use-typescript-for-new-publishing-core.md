# 新发布核心使用 TypeScript 与 ESM

新建的目录、内容加载、渲染编排、构建阶段和题库适配边界统一使用 TypeScript/ESM；旧 JavaScript 插件、EJS 模板和浏览器脚本通过兼容边界逐步迁移，不进行一次性全仓语言转换。这样可以让规范化元数据和文章视图在新边界上获得类型约束，同时控制迁移风险。

## Status

accepted
