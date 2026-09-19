import fs from 'fs'
import path from 'path'
import { parse as jsoncParse, ParseError, printParseErrorCode } from 'jsonc-parser'
import yaml from 'js-yaml'
import { Diagnostic } from '../domain/diagnostics'

export type ConfigFormat = 'jsonc' | 'json' | 'yaml'

export interface LoadedConfig {
    dir: string
    format: ConfigFormat
    data: Record<string, unknown>
}

export const CONFIG_FILE_NAMES = ['config.json', 'config.jsonc', 'config.yaml', 'config.yml'] as const

export function findConfigFile(dir: string): string | null {
    for (const name of CONFIG_FILE_NAMES) {
        const p = path.join(dir, name)
        if (fs.existsSync(p)) return p
    }
    return null
}

export function loadConfig(dir: string, diagnostics: Diagnostic[] = []): LoadedConfig | null {
    const configFile = findConfigFile(dir)
    if (!configFile) return null

    const ext = path.extname(configFile).toLowerCase()
    const raw = fs.readFileSync(configFile, 'utf8')

    let data: unknown
    if (ext === '.yaml' || ext === '.yml') {
        try {
            data = yaml.load(raw)
        }
        catch (err) {
            diagnostics.push({
                phase: 'config-loader',
                level: 'error',
                message: `YAML 解析失败 ${configFile}: ${err instanceof Error ? err.message : String(err)}`,
            })
            return null
        }
    }
    else {
        // jsonc-parser 是容错解析：报告解析错误但保留已解析数据，
        // 与旧实现行为一致，错误通过 diagnostics 暴露。
        const errors: ParseError[] = []
        data = jsoncParse(raw, errors, { allowTrailingComma: true })
        if (errors.length > 0) {
            diagnostics.push({
                phase: 'config-loader',
                level: 'warning',
                message: `JSONC 解析错误 ${configFile}: ${errors.map(e => formatParseError(raw, e)).join(', ')}`,
            })
        }
    }

    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        diagnostics.push({
            phase: 'config-loader',
            level: 'error',
            message: `config 必须是对象: ${configFile}`,
        })
        return null
    }

    return { dir, format: (ext === '.yaml' || ext === '.yml') ? 'yaml' : 'jsonc', data: data as Record<string, unknown> }
}

/** 把 jsonc-parser 的 offset 转成便于定位的 `行:列 描述` 文本（行列从 1 开始）。 */
function formatParseError(raw: string, error: ParseError): string {
    const { line, column } = offsetToLineColumn(raw, error.offset)
    return `${line}:${column} ${printParseErrorCode(error.error)}`
}

function offsetToLineColumn(raw: string, offset: number): { line: number, column: number } {
    const clamped = Math.max(0, Math.min(offset, raw.length))
    let line = 1
    let lineStart = 0
    for (let i = 0; i < clamped; i++) {
        if (raw.charCodeAt(i) === 10) {
            line++
            lineStart = i + 1
        }
    }
    return { line, column: clamped - lineStart + 1 }
}