import ejs from 'ejs'
import fs from 'fs'
import path from 'path'
import { ArticleView } from './article-view'

export interface PageTemplateRendererOptions {
    templateDir: string
    /** 限制 EJS 的 root 路径 */
    root?: string
}

export class PageTemplateRenderer {
    private readonly templateDir: string
    private readonly root: string

    constructor(opts: PageTemplateRendererOptions) {
        this.templateDir = opts.templateDir
        this.root = opts.root || path.resolve(opts.templateDir, '..')
    }

    render(templateName: string, view: ArticleView): string {
        const templatePath = path.join(this.templateDir, templateName)
        if (!fs.existsSync(templatePath)) {
            throw new Error(`模板不存在: ${templatePath}`)
        }

        const raw = fs.readFileSync(templatePath, 'utf8')
        const compiled = ejs.compile(raw, {
            filename: templatePath,
            root: this.root,
        })

        return compiled({
            data: {
                title: view.title,
                id: view.id,
                md_file: {
                    href: view.href,
                    git_location: view.gitLocation,
                    output_path: view.outputPath,
                    output_dir: view.outputDir,
                    relative_path: view.sourcePath.replace(this.root, ''),
                    file_path: view.sourcePath,
                    file_dir: view.sourcePath.substring(0, view.sourcePath.lastIndexOf('/')),
                },
                teach_plan_href: view.teachPlanHref,
            },
            header: view.header,
            content: view.content,
        })
    }
}