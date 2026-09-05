const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

describe('baseline', () => {
    it('package.json has required fields', () => {
        const pkg = require('../package.json')
        assert.ok(pkg.name)
        assert.ok(pkg.scripts.typecheck)
        assert.ok(pkg.scripts.test)
    })

    it('cli help works', () => {
        const { execSync } = require('child_process')
        const result = execSync(`node ${__dirname}/../bin/rbook.js --help`, { encoding: 'utf8' })
        assert.ok(result.includes('Usage:'))
        assert.ok(result.includes('rbook'))
    })

    it('markdown-r shim loads', () => {
        const md = require('../src/lib/markdown-r')
        assert.ok(md.md)
        assert.ok(typeof md.render === 'function')
        const { header, content } = md.render('---\ntitle: Test\n---\n\nHello')
        assert.equal(header.title, 'Test')
        assert.ok(content.includes('Hello'))
    })
})