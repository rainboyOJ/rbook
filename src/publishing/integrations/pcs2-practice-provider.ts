import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

/**
 * 「本文相关题解」的数据来源：pcs2 题解仓库里每道题 frontmatter 的 `showAtRbook`。
 *
 * 语义：showAtRbook 表示「这道题解属于 rbook 的哪篇文章」，是题目 → 文章的反向边，
 * 由题目仓库在写题解时维护（见 rbook_new_problem_solutions 的 oj-show-at-rbook skill）。
 * 本 provider 只认 `rbook1:` 前缀，`rbook2:` 是另一本书的引用，与本站无关。
 *
 * 为什么在构建时扫本地文件而不是调 pcs2 HTTP API：
 * 一次遍历 3700 个 index.md 是毫秒级，而按文章逐篇请求 API 要 142 次网络往返；
 * 静态书的发布也应该能在离线下复现。代价是构建机需要能看到题目仓库，
 * 所以加载失败时要把原因交给调用方，由 build profile 决定报错还是告警。
 */

export interface PracticeProblem {
    oj: string
    problemId: string
    title: string
    difficulty: string
    /** pcs2 题解页的绝对地址 */
    url: string
}

export interface Pcs2PracticeProviderOptions {
    /** pcs2 题目仓库的 problems 目录（其下有 <oj>/<problem_id>/index.md） */
    problemsDir: string
    /** pcs2 站点根地址，用于拼题解链接 */
    publicBaseUrl?: string
}

const DEFAULT_PUBLIC_BASE_URL = 'https://pcs2.roj.ac.cn'
const RBOOK1_PREFIX = 'rbook1:'
const UNKNOWN_DIFFICULTY = '未知'

interface FrontMatterProblem {
    oj?: unknown
    problem_id?: unknown
    title?: unknown
    difficulty?: unknown
    showAtRbook?: unknown
}

export class Pcs2PracticeProvider {
    readonly name = 'pcs2-practice'
    readonly problemsDir: string

    private readonly publicBaseUrl: string
    /** 文章 id -> 该文章下的题目（已按难度排序） */
    private readonly byArticle = new Map<string, PracticeProblem[]>()
    private readonly difficultyRank = new Map<string, number>()
    private scanned = 0

    constructor(opts: Pcs2PracticeProviderOptions) {
        this.problemsDir = opts.problemsDir
        this.publicBaseUrl = (opts.publicBaseUrl || DEFAULT_PUBLIC_BASE_URL).replace(/\/+$/, '')
        this.loadDifficultyRank(path.join(opts.problemsDir, '..', 'lib', 'difficulty.json'))
        this.scan(opts.problemsDir)
    }

    /** 有题解关联的文章数，用于构建日志。 */
    get articleCount(): number {
        return this.byArticle.size
    }

    /** 扫过的 index.md 数量，用于构建日志。 */
    get fileCount(): number {
        return this.scanned
    }

    getProblemsForArticle(articleId: string): PracticeProblem[] {
        return this.byArticle.get(articleId) || []
    }

    /**
     * 难度序的唯一来源是 pcs2 的 lib/difficulty.json（ranked=true 的条目按数组顺序）。
     * 文件缺失时全部算「未知」，退化成按 oj + problem_id 排序，不影响渲染。
     */
    private loadDifficultyRank(file: string): void {
        try {
            const parsed = yaml.load(fs.readFileSync(file, 'utf8')) as { values?: Array<{ value?: unknown, ranked?: unknown }> }
            let rank = 0
            for (const item of parsed?.values || []) {
                if (typeof item?.value !== 'string' || item.ranked === false) continue
                this.difficultyRank.set(item.value, rank++)
            }
        }
        catch {
            // 缺文件属于可降级情况；真正的可用性由 problemsDir 决定。
        }
    }

    private scan(root: string): void {
        for (const file of walkIndexFiles(root)) {
            this.scanned++
            const raw = fs.readFileSync(file, 'utf8')
            // 绝大多数题目没有 rbook1 引用，先做零成本字符串筛，避免解析整个 frontmatter。
            if (!raw.includes(RBOOK1_PREFIX)) continue

            const frontMatter = extractFrontMatter(raw)
            if (!frontMatter) continue

            let data: FrontMatterProblem
            try {
                data = (yaml.load(frontMatter) || {}) as FrontMatterProblem
            }
            catch {
                continue
            }

            const refs = Array.isArray(data.showAtRbook) ? data.showAtRbook : []
            const articles = refs
                .filter((ref): ref is string => typeof ref === 'string' && ref.startsWith(RBOOK1_PREFIX))
                .map(ref => ref.slice(RBOOK1_PREFIX.length).trim())
                .filter(Boolean)
            if (articles.length === 0) continue

            const oj = str(data.oj)
            const problemId = str(data.problem_id)
            if (!oj || !problemId) continue

            const problem: PracticeProblem = {
                oj,
                problemId,
                title: str(data.title),
                difficulty: str(data.difficulty) || UNKNOWN_DIFFICULTY,
                url: `${this.publicBaseUrl}/problems/${encodeURIComponent(oj)}/${encodeURIComponent(problemId)}`,
            }

            for (const articleId of new Set(articles)) {
                const list = this.byArticle.get(articleId) || []
                if (list.some(p => p.oj === problem.oj && p.problemId === problem.problemId)) continue
                list.push(problem)
                this.byArticle.set(articleId, list)
            }
        }

        for (const list of this.byArticle.values()) list.sort((a, b) => this.compare(a, b))
    }

    private compare(a: PracticeProblem, b: PracticeProblem): number {
        const ra = this.difficultyRank.get(a.difficulty) ?? Number.MAX_SAFE_INTEGER
        const rb = this.difficultyRank.get(b.difficulty) ?? Number.MAX_SAFE_INTEGER
        if (ra !== rb) return ra - rb
        if (a.oj !== b.oj) return a.oj < b.oj ? -1 : 1
        return a.problemId.localeCompare(b.problemId, 'en', { numeric: true })
    }
}

export interface LoadPcs2PracticeProviderResult {
    provider: Pcs2PracticeProvider | null
    /** provider 为 null 时的原因，供构建诊断使用 */
    reason: string
}

export function defaultPcs2ProblemsDir(projectRoot: string): string {
    return path.join(projectRoot, '..', 'rbook_new_problem_solutions', 'problems')
}

/**
 * 解析题目目录：显式参数 > 环境变量 PCS2_PROBLEMS_DIR > 兄弟仓库默认路径。
 * 目录不存在时返回 null provider 而不是抛错，由调用方决定告警还是中断。
 */
export function loadPcs2PracticeProvider(opts: {
    projectRoot: string
    problemsDir?: string
}): LoadPcs2PracticeProviderResult {
    const problemsDir = opts.problemsDir
        || process.env.PCS2_PROBLEMS_DIR
        || defaultPcs2ProblemsDir(opts.projectRoot)

    if (!fs.existsSync(problemsDir) || !fs.statSync(problemsDir).isDirectory()) {
        return {
            provider: null,
            reason: `pcs2 题目目录不存在: ${problemsDir}（可用环境变量 PCS2_PROBLEMS_DIR 指定）`,
        }
    }

    return {
        provider: new Pcs2PracticeProvider({ problemsDir }),
        reason: '',
    }
}

/** 只遍历 `<dir>/<oj>/<problem>/index.md` 形态的文件。 */
function walkIndexFiles(dir: string, out: string[] = []): string[] {
    let entries: fs.Dirent[]
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true })
    }
    catch {
        return out
    }
    for (const entry of entries) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) walkIndexFiles(full, out)
        else if (entry.name === 'index.md') out.push(full)
    }
    return out
}

function extractFrontMatter(raw: string): string | null {
    const m = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(raw)
    return m ? m[1] : null
}

function str(v: unknown): string {
    if (typeof v === 'string') return v.trim()
    if (typeof v === 'number') return String(v)
    return ''
}
