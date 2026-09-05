import MarkdownIt from 'markdown-it'
import containersPlugin from './plugins/containers'
import rbookLinkPlugin, { RbookLinkOptions } from './plugins/rbook-link'
import problemListPlugin from './plugins/problem-list'
import fencePlugin from './plugins/fence'
import excalidrawPlugin, { ExcalidrawOptions } from './plugins/excalidraw'

export interface PluginRegistryOptions {
    rbookLink: RbookLinkOptions
    excalidraw?: ExcalidrawOptions
}

export function registerPlugins(md: MarkdownIt, opts: PluginRegistryOptions): void {
    md.use(containersPlugin)
    md.use(rbookLinkPlugin, opts.rbookLink)
    md.use(problemListPlugin, opts.rbookLink)
    md.use(fencePlugin)
    md.use(excalidrawPlugin, opts.excalidraw || {})
}