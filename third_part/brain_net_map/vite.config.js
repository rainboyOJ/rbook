import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'
import loadData from './load_data.js'

export default defineConfig({ plugins: [loadData(), {
    name: 'shared-site-theme',
    transformIndexHtml(html) {
        // Keep charset first, then run the article controller before styles or
        // body content. Inline it for both standalone dev and published pages.
        const controller = readFileSync(new URL('../../src/public/js/theme-controller.js', import.meta.url), 'utf8')
            .replace(/<\/script/gi, '<\\/script')
        return html.replace('<meta charset="UTF-8">', charset => `${charset}<script>${controller}</script>`)
    },
}] })
