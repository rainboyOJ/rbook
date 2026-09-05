import MarkdownIt from 'markdown-it'
import path from 'path'

export interface ExcalidrawOptions {
    excalidrawServerAddr?: string
    blogUrl?: string
    basePath?: string
}

export default function excalidrawPlugin(md: MarkdownIt, opts: ExcalidrawOptions = {}): void {
    const defaultImage = md.renderer.rules.image || function(tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options)
    }

    const server = opts.excalidrawServerAddr || 'https://excalidraw.roj.ac.cn'
    const blogUrl = opts.blogUrl || 'https://rbook.roj.ac.cn'

    md.renderer.rules.image = function(tokens, idx, options, env, self) {
        const token = tokens[idx]
        const src = token.attrGet('src')

        if (!src) return defaultImage(tokens, idx, options, env, self)

        const parts = src.split('.').map(s => s.toLowerCase())
        const ext = parts[parts.length - 1]
        const prev = parts[parts.length - 2]

        if (!(ext === 'svg' && prev === 'excalidraw')) {
            return defaultImage(tokens, idx, options, env, self)
        }

        const imgTag = defaultImage(tokens, idx, options, env, self)

        let imgUrl = ''
        let errorMsg = ''

        try {
            if (src.startsWith('http://') || src.startsWith('https://')) {
                imgUrl = src
            }
            else if (src.startsWith('/')) {
                imgUrl = blogUrl + src
            }
            else {
                const basePath = opts.basePath || '.'
                const currentMdFile = (env as any)?.currentMdFilePath || ''
                if (currentMdFile) {
                    const realPath = path.resolve(path.dirname(currentMdFile), src)
                    imgUrl = blogUrl + '/' + path.relative(basePath, realPath).replace(/\\/g, '/')
                }
                else {
                    imgUrl = blogUrl + '/' + src
                }
            }
        }
        catch (err) {
            errorMsg = `Error reading file ${src}: ${err}`
        }

        const badge = errorMsg
            ? `<span class="image-extension-badge" style="color:red;" title="Error">${errorMsg}</span>`
            : `<a class="image-extension-badge" style="align-self: flex-end;" href="${server}/#url=${encodeURIComponent(imgUrl)}" target="_blank" title="Open in Excalidraw">Open in Excalidraw</a>`

        return `<div class="image-wrapper" style="display:flex; flex-direction:column; align-items:center; width:100%; height:100%;">${badge} ${imgTag}</div>`
    }
}