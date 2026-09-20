export type DiagnosticLevel = 'error' | 'warning' | 'info'

export interface Diagnostic {
    phase: string
    articleId?: string
    sourcePath?: string
    /** 1 起的行号（可选），用于直接定位到出问题的 md 行。 */
    line?: number
    level: DiagnosticLevel
    message: string
    suggestion?: string
}

export function createDiagnostic(opts: Omit<Diagnostic, 'level'> & { level?: DiagnosticLevel }): Diagnostic {
    return { level: 'error', ...opts }
}

export function formatDiagnostic(d: Diagnostic): string {
    const target = d.sourcePath || d.articleId
    const loc = target ? `[${target}${d.line ? `:${d.line}` : ''}]` : ''
    return `${d.level.toUpperCase()} ${loc} ${d.phase}: ${d.message}${d.suggestion ? ` (${d.suggestion})` : ''}`
}