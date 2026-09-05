/**
 * scripts/menu-to-catalog.cjs — 一次性转换脚本
 * 从 src/menu.js 的 `menu` 数组机械生成 book/catalog.yaml
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const menuSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'menu.js'), 'utf8')

// 提取 const menu = [...] 部分
const start = menuSrc.indexOf('const menu = [')
const end = menuSrc.indexOf('// 把menu数据转成') // 第一个注释
const menuDef = menuSrc.slice(start, end).trim()

// 用 VM 捕获 menu 变量
const vm = require('vm')
const sandbox = { console }
const code = menuDef.replace('const menu = [', 'menu = [')
vm.runInNewContext(code, sandbox)
const menu = sandbox.menu

function convert(items) {
    const result = []
    for (const item of items) {
        const entry = { title: item.title }
        if (item.child) {
            entry.children = convert(item.child)
        }
        if (item.path) {
            entry.path = item.path
        }
        result.push(entry)
    }
    return result
}

const catalog = convert(menu)

// 用 js-yaml 输出，但 js-yaml 可能没有或者有
// 直接写一个简单的 YAML 生成器
function toYaml(obj, indent = 0) {
    const pad = ' '.repeat(indent)
    const pad2 = ' '.repeat(indent + 2)
    let out = ''
    if (Array.isArray(obj)) {
        for (const item of obj) {
            out += `${pad}- title: ${JSON.stringify(item.title)}\n`
            if (item.path) {
                out += `${pad2}path: ${JSON.stringify(item.path)}\n`
            }
            if (item.children) {
                out += `${pad2}children:\n`
                out += toYaml(item.children, indent + 4)
            }
        }
    }
    return out
}

const yaml = toYaml(catalog)
const outPath = path.join(__dirname, '..', 'book', 'catalog.yaml')
fs.writeFileSync(outPath, yaml, 'utf8')
console.log(`catalog.yaml 已写入: ${outPath}`)
console.log(`条目数: ${menu.length}`)