import fs from 'fs'
import path from 'path'
import { mkdirp } from 'mkdirp'
import { Diagnostic } from '../domain/diagnostics'

export interface ArtifactWriterOptions {
    diagnostics?: Diagnostic[]
}

export class ArtifactWriter {
    private readonly diagnostics: Diagnostic[]

    constructor(opts: ArtifactWriterOptions = {}) {
        this.diagnostics = opts.diagnostics || []
    }

    writeHtml(outputPath: string, html: string): void {
        const dir = path.dirname(outputPath)
        try {
            mkdirp.sync(dir)
        }
        catch (err) {
            this.diagnostics.push({
                phase: 'artifact-writer',
                level: 'error',
                message: `无法创建输出目录: ${dir} (${err instanceof Error ? err.message : String(err)})`,
            })
            throw err
        }

        try {
            fs.writeFileSync(outputPath, html, { encoding: 'utf8' })
        }
        catch (err) {
            this.diagnostics.push({
                phase: 'artifact-writer',
                level: 'error',
                message: `写入失败: ${outputPath} (${err instanceof Error ? err.message : String(err)})`,
            })
            throw err
        }
    }

    copyArtifact(src: string, dest: string): void {
        if (!fs.existsSync(src)) {
            this.diagnostics.push({
                phase: 'artifact-writer',
                level: 'error',
                message: `附件不存在: ${src}`,
                suggestion: '检查 copy 字段和文件路径',
            })
            return
        }

        const destDir = path.dirname(dest)
        try {
            mkdirp.sync(destDir)
            fs.copyFileSync(src, dest)
        }
        catch (err) {
            this.diagnostics.push({
                phase: 'artifact-writer',
                level: 'error',
                message: `附件复制失败: ${src} -> ${dest} (${err instanceof Error ? err.message : String(err)})`,
            })
        }
    }

    copyArtifacts(sourceDir: string, outputDir: string, files: string[]): void {
        for (const f of files) {
            const src = path.resolve(sourceDir, f)
            const dest = path.resolve(outputDir, f)
            this.copyArtifact(src, dest)
        }
    }
}