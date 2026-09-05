import path from 'path'

export interface ProjectPaths {
    projectRoot: string
    bookDir: string
    distDir: string
    srcDir: string
}

export class PathPolicy {
    private readonly projectRoot: string
    private readonly bookDir: string
    private readonly distDir: string

    constructor(projectRoot?: string) {
        this.projectRoot = projectRoot
            ? path.resolve(projectRoot)
            : path.resolve(process.cwd())
        this.bookDir = path.join(this.projectRoot, 'book')
        this.distDir = path.join(this.projectRoot, 'dist')
    }

    get root(): string {
        return this.projectRoot
    }

    get book(): string {
        return this.bookDir
    }

    get dist(): string {
        return this.distDir
    }

    /** 从相对 book 的路径解析到项目内绝对源路径 */
    resolveSource(bookRelative: string): string {
        const p = path.isAbsolute(bookRelative)
            ? bookRelative
            : path.join(this.bookDir, bookRelative)
        if (!p.startsWith(this.projectRoot)) {
            throw new Error(`路径越界: ${bookRelative}`)
        }
        return path.normalize(p)
    }

    /** 源路径 -> 相对 book 的路径 */
    relativeToBook(sourcePath: string): string {
        return path.relative(this.bookDir, sourcePath)
    }

    /** 源路径 -> 发布 href (web 相对路径) */
    publishHref(sourcePath: string): string {
        const rel = this.relativeToBook(sourcePath)
            .replace(/\.md$/i, '.html')
            .replace(/[\\/]+/g, '/')
        return '/' + rel
    }

    /** 源路径 -> 输出绝对路径 (dist 下) */
    outputPath(sourcePath: string): string {
        const href = this.publishHref(sourcePath)
        return path.join(this.distDir, href.replace(/^\//, ''))
    }

    /** Git URL */
    gitLocation(sourcePath: string, repo = 'https://github.com/rainboyOJ/rbook'): string {
        const rel = this.relativeToBook(sourcePath).replace(/[\\/]+/g, '/')
        return `${repo}/tree/master/book/${rel}`
    }
}