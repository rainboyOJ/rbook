export interface ArticleSource {
    filePath: string
    raw: string
    dir: string
}

export interface ArticleView {
    title: string
    href: string
    content: string
    badges?: Record<string, string>
    teachPlanHref?: string
}