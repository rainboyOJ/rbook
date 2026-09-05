#!/usr/bin/env node

// rbook CLI — 转发到新发布管线
// 旧实现保留在 bin/rbook.old.js 迁移后删除
const path = require('path')
const projectRoot = path.resolve(__dirname, '..')

try {
    require(path.join(projectRoot, '.tsbuild/publishing/cli/index.js'))
}
catch (e) {
    console.error('新的发布管线未编译，请先运行: npx tsc -p tsconfig.publishing.json')
    console.error(e.message)
    process.exit(1)
}
