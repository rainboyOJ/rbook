/**
 * snapshot-normalizer.js
 *
 * 归一化渲染输出中的动态字段，使快照可重复比较：
 * - 去除绝对路径（/home/... 或 URL-encoded 变体）
 * - 去除访问计数徽章（visitor-badge / visits）
 * - 去除时间戳与日期
 * - 归一化换行与空白
 */
function normalizeSnapshot(raw) {
    let s = String(raw)

    // 去除绝对路径
    s = s.replace(/\/home\/[^\s"'<>]+/g, '<ABS_PATH>')
    // URL-encoded 的中文/绝对路径
    s = s.replace(/%[0-9A-Fa-f]{2}/g, '_')
    // 去除绝对路径（URL 形式）
    s = s.replace(/\/home\/[^\s"'<>()]+/g, '<ABS_PATH>')

    // 去除访问计数徽章 URL
    s = s.replace(/visitor-badge\.laobi\.icu\/badge\?page_id=[^\s"']+/g, '<VISIT_BADGE>')
    s = s.replace(/visits\.dashroshan\.com\/[^\s"']+/g, '<VISIT_BADGE>')

    // 去除日期与时间
    s = s.replace(/\d{4}[-/]\d{1,2}[-/]\d{1,2}([ T]\d{1,2}:\d{2}(:\d{2})?)?/g, '<DATE>')
    s = s.replace(/\b\w{3} \w{3} {1,2}\d{1,2} \d{1,2}:\d{2}:\d{2} \w{3} \d{4}\b/g, '<DATE>')

    // 归一化连续空白
    s = s.replace(/\s+/g, ' ')

    return s.trim()
}

module.exports = { normalizeSnapshot }