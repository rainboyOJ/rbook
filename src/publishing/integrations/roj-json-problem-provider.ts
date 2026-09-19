import fs from 'fs'
import path from 'path'
import { ProblemInfo, ProblemProvider } from './problem-provider'

/**
 * 从 problems 仓库的 roj.json 读取题目数据的 provider。
 *
 * 为什么不直接用 problems/src/lib/database/index.js：
 * 那个类依赖 lokijs，且数据库路径指向不存在的 `problem.db`
 * （真实数据是 `roj.json`），导致 require 直接抛错、provider 不可用，
 * 线上所有 `[[[p: ...]]]` 都退化成 `extra-link missing`。
 * 这里直接读 roj.json（LokiJS 的序列化格式，本身就是普通 JSON），
 * 零额外依赖、无副作用。
 */

interface RawProblem {
    _id?: string
    sid?: string
    oj?: string
    title?: string
    link?: string
    solutions?: Array<{ practice_rbook?: string[] }>
}

export interface RojJsonProblemProviderOptions {
    /** roj.json 路径；默认 <projectRoot>/../problems/src/roj.json */
    jsonPath: string
}

export class RojJsonProblemProvider implements ProblemProvider {
    readonly name = 'roj-json'

    private readonly byId = new Map<string, ProblemInfo>()
    /** rbook 文章 id -> 关联题目 */
    private readonly byRbookId = new Map<string, ProblemInfo[]>()
    private readonly withSolution = new Set<string>()

    constructor(opts: RojJsonProblemProviderOptions) {
        const raw = fs.readFileSync(opts.jsonPath, 'utf8')
        const parsed = JSON.parse(raw) as { collections?: Array<{ name?: string, data?: RawProblem[] }> }
        const collection = parsed.collections?.find(c => c.name === 'problem') || parsed.collections?.[0]
        const problems = collection?.data || []

        for (const p of problems) {
            const id = str(p._id)
            if (!id) continue

            const info: ProblemInfo = {
                id,
                oj: str(p.oj),
                sid: str(p.sid),
                title: str(p.title),
                link: str(p.link),
                hasSolution: Array.isArray(p.solutions) && p.solutions.length > 0,
            }
            this.byId.set(id, info)
            if (info.hasSolution) this.withSolution.add(id)

            for (const sol of p.solutions || []) {
                for (const rbookId of sol.practice_rbook || []) {
                    const key = str(rbookId)
                    if (!key) continue
                    const list = this.byRbookId.get(key) || []
                    list.push(info)
                    this.byRbookId.set(key, list)
                }
            }
        }
    }

    get count(): number {
        return this.byId.size
    }

    getProblemById(id: string): ProblemInfo | null {
        return this.byId.get(id) || null
    }

    getProblemsForArticle(rbookId: string): ProblemInfo[] {
        return this.byRbookId.get(rbookId) || []
    }

    hasSolution(id: string): boolean {
        return this.withSolution.has(id)
    }
}

function str(v: unknown): string {
    if (typeof v === 'string') return v
    if (typeof v === 'number') return String(v)
    return ''
}

/** 解析 roj.json 的默认位置（problems 与本项目同级）。 */
export function defaultRojJsonPath(projectRoot: string): string {
    return path.join(projectRoot, '..', 'problems', 'src', 'roj.json')
}
