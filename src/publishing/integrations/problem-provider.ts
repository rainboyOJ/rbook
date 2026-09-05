export interface ProblemInfo {
    id: string
    oj: string
    sid: string
    title: string
    link: string
    hasSolution?: boolean
}

export interface ProblemProvider {
    getProblemById(id: string): ProblemInfo | null
    getProblemsForArticle(rbookId: string): ProblemInfo[]
    name: string
}

export interface OptionalProblemProvider extends ProblemProvider {
    isAvailable(): boolean
    reason?(): string
}