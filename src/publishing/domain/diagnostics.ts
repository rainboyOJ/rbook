export type DiagnosticLevel = 'error' | 'warning' | 'info'

export interface Diagnostic {
    phase: string
    articleId?: string
    sourcePath?: string
    level: DiagnosticLevel
    message: string
    suggestion?: string
}

export function createDiagnostic(opts: Omit<Diagnostic, 'level'> & { level?: DiagnosticLevel }): Diagnostic {
    return { level: 'error', ...opts }
}

export function formatDiagnostic(d: Diagnostic): string {
    const loc = d.articleId ? `[${d.articleId}]` : d.sourcePath ? `[${d.sourcePath}]` : ''
    return `${d.level.toUpperCase()} ${loc} ${d.phase}: ${d.message}${d.suggestion ? ` (${d.suggestion})` : ''}`
}