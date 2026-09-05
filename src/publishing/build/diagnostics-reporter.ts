import { Diagnostic, formatDiagnostic } from '../domain/diagnostics'

export function reportDiagnostics(diagnostics: Diagnostic[]): void {
    const errors = diagnostics.filter(d => d.level === 'error')
    const warnings = diagnostics.filter(d => d.level === 'warning')

    if (warnings.length > 0) {
        console.log(`\n警告 (${warnings.length}):`)
        warnings.forEach(w => console.log(`  ${formatDiagnostic(w)}`))
    }
    if (errors.length > 0) {
        console.log(`\n错误 (${errors.length}):`)
        errors.forEach(e => console.error(`  ${formatDiagnostic(e)}`))
    }
}