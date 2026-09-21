import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE_ROOT = path.join(PACKAGE_ROOT, 'src')

async function sourceFiles(directory) {
    const entries = await readdir(directory, { withFileTypes: true })
    const nested = await Promise.all(entries.map(entry => {
        const filePath = path.join(directory, entry.name)
        return entry.isDirectory() ? sourceFiles(filePath) : [filePath]
    }))
    return nested.flat().filter(filePath => filePath.endsWith('.ts'))
}

describe('@rbook/animation package boundary', () => {
    it('源码导入不能越过包目录或依赖站点发布代码', async () => {
        const violations = []
        for (const filePath of await sourceFiles(SOURCE_ROOT)) {
            const source = await readFile(filePath, 'utf8')
            const specifiers = source.matchAll(/(?:from\s+|import\s*\()['"]([^'"]+)['"]/g)
            for (const [, specifier] of specifiers) {
                if (specifier.includes('src/publishing') || specifier.includes('book/')) {
                    violations.push(`${path.relative(PACKAGE_ROOT, filePath)} -> ${specifier}`)
                }
                if (specifier.startsWith('.')) {
                    const target = path.resolve(path.dirname(filePath), specifier)
                    const relative = path.relative(PACKAGE_ROOT, target)
                    if (relative.startsWith('..') || path.isAbsolute(relative)) {
                        violations.push(`${path.relative(PACKAGE_ROOT, filePath)} -> ${specifier}`)
                    }
                }
            }
        }

        assert.deepEqual(violations, [])
    })
})
