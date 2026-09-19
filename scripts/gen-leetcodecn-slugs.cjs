#!/usr/bin/env node
/**
 * gen-leetcodecn-slugs.cjs
 *
 * 从 leetcode.cn 官方 API 生成 题号 -> slug 映射，写入
 * book/problem-sources/leetcodecn-slugs.json。
 *
 * 为什么需要：rbook 内容里用数字题号引用 leetcodecn（如 [[[p: leetcodecn-724]]]），
 * 但 leetcode.cn 只接受 slug（/problems/724/ 返回 404，/problems/find-pivot-index/ 才是 200）。
 * 该表把数字翻译成 slug，使链接可用。
 *
 * 用法: node scripts/gen-leetcodecn-slugs.cjs
 */
const fs = require('fs')
const path = require('path')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const OUT = path.join(PROJECT_ROOT, 'book', 'problem-sources', 'leetcodecn-slugs.json')
const API = 'https://leetcode.cn/api/problems/all/'

async function main() {
    console.log(`拉取 ${API} ...`)
    const res = await fetch(API, {
        headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'application/json',
        },
    })
    if (!res.ok) {
        console.error(`请求失败: HTTP ${res.status}`)
        process.exit(1)
    }

    const data = await res.json()
    const pairs = data.stat_status_pairs || []
    const slugs = {}
    for (const p of pairs) {
        const stat = p.stat || {}
        const num = String(stat.frontend_question_id ?? '')
        const slug = stat.question__title_slug
        if (num && slug) slugs[num] = slug
    }

    const out = {
        note: 'leetcode.cn 题号 -> slug 映射。由 scripts/gen-leetcodecn-slugs.cjs 从 https://leetcode.cn/api/problems/all/ 生成。',
        count: Object.keys(slugs).length,
        slugs,
    }

    fs.mkdirSync(path.dirname(OUT), { recursive: true })
    fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8')
    console.log(`已写入 ${path.relative(PROJECT_ROOT, OUT)} (${out.count} 条)`)
}

main().catch(err => {
    console.error(`失败: ${err.message}`)
    process.exit(1)
})
