export interface LearningArticle {
    id: string
    title: string
    label: string
    href: string
}

export interface LearningRelations {
    prerequisites: LearningArticle[]
    successors: LearningArticle[]
}

interface LearningSource {
    id: string
    pre: unknown
}

export function isLearningArticle(metadata: Record<string, unknown>, hidden = false): boolean {
    return !hidden && !metadata.hiden_brain_map && !metadata.hidden_brain_map
}

export function buildLearningEdges(articles: LearningSource[], missing?: (id: string, pre: string) => void) {
    const ids = new Set(articles.map(article => article.id))
    const edges: { from: string; to: string }[] = []
    for (const { id, pre } of articles) {
        const prerequisites = typeof pre === 'string' ? [pre] : Array.isArray(pre) ? pre : []
        for (const from of new Set(prerequisites)) {
            if (typeof from !== 'string' || from === id) continue
            if (ids.has(from)) edges.push({ from, to: id })
            else missing?.(id, from)
        }
    }
    return edges
}
