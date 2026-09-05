/**
 * structured-diff.js
 *
 * 对比两份渲染输出的结构化差异。用于 Phase 1 记录
 * 旧实现/当前产物 与 新实现的差异分类。
 *
 * 分类:
 * - missing-marker: 旧输出有、新输出缺的关键标记
 * - added-marker: 新输出有、旧输出缺的关键标记
 * - text-diff: 归一化文本不相等
 */
const { normalizeSnapshot } = require('./snapshot-normalizer.js')

function diffOutput(oldHtml, newHtml) {
    const oldNorm = normalizeSnapshot(oldHtml)
    const newNorm = normalizeSnapshot(newHtml)
    const result = { equal: oldNorm === newNorm, differences: [] }

    if (result.equal) return result

    const oldMarkers = extractMarkers(oldHtml)
    const newMarkers = extractMarkers(newHtml)

    for (const m of oldMarkers) {
        if (!newMarkers.has(m)) {
            result.differences.push({ type: 'missing-marker', marker: m })
        }
    }
    for (const m of newMarkers) {
        if (!oldMarkers.has(m)) {
            result.differences.push({ type: 'added-marker', marker: m })
        }
    }

    result.differences.push({ type: 'text-diff', oldLength: oldNorm.length, newLength: newNorm.length })
    return result
}

function extractMarkers(html) {
    const markers = new Set()
    const classRe = /class="([^"]+)"/g
    let m
    while ((m = classRe.exec(html))) {
        markers.add(`class="${m[1]}"`)
    }
    const tagRe = /<(h[1-6]|pre|code|table|ul|ol|div|img|video|iframe)\b/g
    while ((m = tagRe.exec(html))) {
        markers.add(`<${m[1]}`)
    }
    return markers
}

module.exports = { diffOutput, normalizeSnapshot }