# 使用标准 markdown-it 作为渲染核心

Rbook 的 Markdown 渲染核心采用标准 `markdown-it`，现有 Rbook 语法通过显式注册的插件和兼容适配层接入；`markdown-r` 在迁移完成后移除。本次只更换核心边界，不同时引入 Nunjucks、Vue 等模板或前端框架变化，并以语法 fixture 和生成结果对比保护已发布内容契约。

## Status

accepted
