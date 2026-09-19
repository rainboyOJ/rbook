import fs from 'fs'
import path from 'path'
import type { Diagnostic } from '../domain/diagnostics'

/**
 * 题目链接解析：把 (oj, pid) 解析成可访问的 URL 与显示标题。
 *
 * URL 路由（实测确定，见 docs/adr/0008）：
 *   roj          -> https://roj.ac.cn/problem/{id}          （无尾斜杠）
 *   其它         -> https://pcs2.roj.ac.cn/problems/{oj}/{pid}/  （有尾斜杠）
 *   缺失回退     -> 各 OJ 官方站
 *
 * 标题来源：sibling 仓库 ../rbook_new_problem_solutions 的 front matter。
 * 该仓库缺失时不影响构建（标题退化为裸 id），只在诊断里提示。
 */

export interface ProblemUrlOptions {
    /** 项目根目录，用于定位 sibling 题库仓库与静态映射表 */
    projectRoot: string
    diagnostics?: Diagnostic[]
    /** 覆盖 pcs2 base（默认 https://pcs2.roj.ac.cn，可用环境变量 RBOOK_PCS2_BASE 覆盖） */
    pcs2Base?: string
    /** 覆盖 roj base（默认 https://roj.ac.cn，可用 RBOOK_ROJ_BASE 覆盖） */
    rojBase?: string
    /** 覆盖题库仓库目录（默认 <projectRoot>/../rbook_new_problem_solutions/problems） */
    problemRepoDir?: string
}

export interface ResolvedProblem {
    oj: string
    pid: string
    /** 规范化后的 oj（别名映射后） */
    normalizedOj: string
    /** 规范化后的 pid（luogu 补 P 等） */
    normalizedPid: string
    title: string
    url: string
    /** 是否在题库仓库里找到（false = 走了官方站回退或无法生成） */
    known: boolean
    /** 数据来源：repo / fallback / none */
    source: 'repo' | 'fallback' | 'none'
}

/** oj 别名：源文件里的写法 -> 规范名 */
const OJ_ALIAS: Record<string, string> = {
    noiopenjudge: 'noi_openjudge',
    awcing: 'acwing',
}

/**
 * 已知拼写错误：映射成功但源文件应修正，构建时发 warning。
 * （noiopenjudge 是历史合法写法，不算错误；awcing 是明确笔误。）
 */
const OJ_TYPO: Record<string, string> = {
    awcing: 'acwing',
}

/** 各 OJ 的官方站 URL 模板，用于题库仓库缺失时回退。 */
const OFFICIAL_URL: Record<string, (pid: string) => string> = {
    luogu: pid => `https://www.luogu.com.cn/problem/${normalizeLuogu(pid)}`,
    acwing: pid => `https://www.acwing.com/problem/content/${pid}/`,
    vjudge: pid => `https://vjudge.net/problem/${pid}`,
    noi_openjudge: pid => `http://noi.openjudge.cn/${toNoiPath(pid)}/`,
    codeforces: pid => `https://codeforces.com/problemset/problem/${pid.replace(/^(\d+)([A-Za-z].*)$/, '$1/$2')}`,
    atcoder: pid => `https://atcoder.jp/contests/${pid.split('_')[0]}/tasks/${pid}`,
    poj: pid => `http://poj.org/problem?id=${pid}`,
    hdu: pid => `https://acm.hdu.edu.cn/showproblem.php?pid=${pid}`,
    usaco: pid => `http://www.usaco.org/index.php?page=viewproblem2&cpid=${pid}`,
    leetcodecn: pid => `https://leetcode.cn/problems/${pid}/`,
}

/** luogu 的题号规范化为 Pxxxx 形式（1048 -> P1048）。 */
export function normalizeLuogu(pid: string): string {
    const v = String(pid).trim()
    const m = /^p?(\d+)$/i.exec(v)
    return m ? `P${m[1]}` : v
}

/** noi_openjudge 的 ch0101-01 -> ch0101/01。 */
function toNoiPath(pid: string): string {
    return String(pid).trim().replace(/-/g, '/')
}

export class ProblemUrlResolver {
    private readonly diagnostics: Diagnostic[]
    private readonly pcs2Base: string
    private readonly rojBase: string
    private readonly repoDir: string
    /** normalizedOj -> (pidLower -> title) */
    private readonly titles = new Map<string, Map<string, string>>()
    private readonly leetcodeSlugs = new Map<string, string>()
    private readonly warnedOj = new Set<string>()
    private repoAvailable = false

    constructor(opts: ProblemUrlOptions) {
        this.diagnostics = opts.diagnostics || []
        this.pcs2Base = trimSlash(opts.pcs2Base || process.env.RBOOK_PCS2_BASE || 'https://pcs2.roj.ac.cn')
        this.rojBase = trimSlash(opts.rojBase || process.env.RBOOK_ROJ_BASE || 'https://roj.ac.cn')
        this.repoDir = opts.problemRepoDir || path.join(opts.projectRoot, '..', 'rbook_new_problem_solutions', 'problems')

        this.loadProblemRepo()
        this.loadLeetcodeSlugs(opts.projectRoot)
    }

    /** 构建期读 sibling 仓库的 front matter，建立 oj+pid -> title 索引。 */
    private loadProblemRepo(): void {
        if (!fs.existsSync(this.repoDir)) {
            this.diagnostics.push({
                phase: 'problem-url',
                level: 'warning',
                message: `题库仓库不存在: ${this.repoDir}（题目标题将退化为裸 id；可用 problemRepoDir 覆盖）`,
            })
            return
        }

        let ojDirs: string[] = []
        try {
            ojDirs = fs.readdirSync(this.repoDir, { withFileTypes: true })
                .filter(e => e.isDirectory())
                .map(e => e.name)
        }
        catch (err) {
            this.diagnostics.push({
                phase: 'problem-url',
                level: 'warning',
                message: `题库仓库不可读: ${this.repoDir} (${err instanceof Error ? err.message : String(err)})`,
            })
            return
        }

        for (const oj of ojDirs) {
            const ojDir = path.join(this.repoDir, oj)
            const table = new Map<string, string>()
            let pids: string[] = []
            try {
                pids = fs.readdirSync(ojDir, { withFileTypes: true })
                    .filter(e => e.isDirectory())
                    .map(e => e.name)
            }
            catch { continue }

            for (const dirName of pids) {
                const md = path.join(ojDir, dirName, 'index.md')
                if (!fs.existsSync(md)) continue
                let raw: string
                try { raw = fs.readFileSync(md, 'utf8') }
                catch { continue }

                const pid = frontmatter(raw, 'problem_id') || dirName
                const title = frontmatter(raw, 'title') || ''
                table.set(pid.toLowerCase(), title)
                table.set(dirName.toLowerCase(), title)
            }
            this.titles.set(oj.toLowerCase(), table)
        }
        this.repoAvailable = true
    }

    private loadLeetcodeSlugs(projectRoot: string): void {
        const file = path.join(projectRoot, 'book', 'problem-sources', 'leetcodecn-slugs.json')
        if (!fs.existsSync(file)) return
        try {
            const data = JSON.parse(fs.readFileSync(file, 'utf8')) as { slugs?: Record<string, string> }
            for (const [num, slug] of Object.entries(data.slugs || {})) {
                this.leetcodeSlugs.set(num, slug)
            }
        }
        catch { /* 静态表损坏不应阻断构建 */ }
    }

    get isRepoAvailable(): boolean {
        return this.repoAvailable
    }

    get titleCount(): number {
        let n = 0
        for (const t of this.titles.values()) n += t.size
        return n
    }

    resolve(ojRaw: string, pidRaw: string, inlineTitle?: string, sourcePath?: string): ResolvedProblem {
        const oj = String(ojRaw || '').trim().toLowerCase()
        const pid = String(pidRaw || '').trim()
        const normalizedOj = OJ_ALIAS[oj] || oj

        // 拼写错误提醒（每文件每 oj 一次）
        if (OJ_TYPO[oj]) {
            const key = `${oj}|${sourcePath || ''}`
            if (!this.warnedOj.has(key)) {
                this.warnedOj.add(key)
                this.diagnostics.push({
                    phase: 'problem-url',
                    level: 'warning',
                    sourcePath,
                    message: `oj 拼写疑似错误: "${oj}"，已按 "${OJ_TYPO[oj]}" 处理`,
                    suggestion: `请把源文件改为 ${OJ_TYPO[oj]}`,
                })
            }
        }

        const normalizedPid = this.normalizePid(normalizedOj, pid)
        const repoTitle = this.lookupTitle(normalizedOj, pid, normalizedPid)
        const known = repoTitle !== null

        // 标题优先级：库 > 内联 > 裸 id
        const title = repoTitle || inlineTitle || ''

        const url = this.buildUrl(normalizedOj, normalizedPid, pid)
        const source: ResolvedProblem['source'] = known ? 'repo' : (url ? 'fallback' : 'none')

        if (!url) {
            this.diagnostics.push({
                phase: 'problem-url',
                level: 'warning',
                sourcePath,
                message: `无法生成题目链接: ${oj}/${pid}（未知 oj 且无官方站模板）`,
            })
        }

        return { oj, pid, normalizedOj, normalizedPid, title, url, known, source }
    }

    private normalizePid(oj: string, pid: string): string {
        if (oj === 'luogu') return normalizeLuogu(pid)
        if (oj === 'noi_openjudge') return pid.replace(/\//g, '-').replace(/-+$/, '')
        if (oj === 'leetcodecn' && /^\d+$/.test(pid)) {
            return this.leetcodeSlugs.get(pid) || pid
        }
        return pid
    }

    private lookupTitle(oj: string, pid: string, normalizedPid: string): string | null {
        const table = this.titles.get(oj)
        if (!table) return null
        return table.get(pid.toLowerCase()) ?? table.get(normalizedPid.toLowerCase()) ?? null
    }

    private buildUrl(oj: string, normalizedPid: string, rawPid: string): string {
        // roj 走自己的站点（老题只有 roj.ac.cn 有）
        if (oj === 'roj') return `${this.rojBase}/problem/${rawPid}`

        // 在题库仓库里找到的，走 pcs2
        if (this.titles.get(oj)?.has(normalizedPid.toLowerCase())) {
            return `${this.pcs2Base}/problems/${oj}/${encodeURIComponent(normalizedPid)}/`
        }

        // 缺失回退：各 OJ 官方站
        const tpl = OFFICIAL_URL[oj]
        if (tpl) return tpl(normalizedPid)

        // 没有官方站模板，仍尝试 pcs2（未知 oj 会 404，但至少形式一致）
        return `${this.pcs2Base}/problems/${oj}/${encodeURIComponent(normalizedPid)}/`
    }
}

function trimSlash(s: string): string {
    return s.replace(/\/+$/, '')
}

/** 极简 front matter 取值（只取顶层 `key: value` 标量）。 */
export function frontmatter(raw: string, key: string): string | null {
    const m = new RegExp(`^${key}\\s*:\\s*(.+)$`, 'm').exec(raw)
    if (!m) return null
    return m[1].trim().replace(/^["']|["']$/g, '')
}
