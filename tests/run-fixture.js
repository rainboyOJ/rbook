/**
 * run-fixture.js — CLI entry for `npm run render:fixture`
 *
 * 用法: node tests/run-fixture.js [fixture-name]
 * 不带参数时列出所有 fixture
 */
const path = require('path')
const fs = require('fs')
const { runFixture } = require('./helpers/fixture-runner.js')

const FIXTURES = path.join(__dirname, 'fixtures', 'markdown')

const fixtureName = process.argv[2]
if (!fixtureName) {
    console.log('可用的 fixture:')
    for (const f of fs.readdirSync(FIXTURES).filter(f => f.endsWith('.md'))) {
        console.log(`  ${f}`)
    }
    process.exit(0)
}

const fixturePath = path.join(FIXTURES, fixtureName)
if (!fs.existsSync(fixturePath)) {
    console.error(`fixture 不存在: ${fixtureName}`)
    process.exit(1)
}

const { normalized, html, header } = runFixture(fixturePath)
console.log(`=== ${fixtureName} ===`)
console.log(`title: ${header.title || '(无标题)'}`)
console.log(`normalized length: ${normalized.length}`)
console.log('--- normalized output (前 500 字符) ---')
console.log(normalized.slice(0, 500))
console.log('---')