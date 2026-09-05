declare module 'markdown-it-container' {
    import type MarkdownIt from 'markdown-it'

    interface ContainerOpts {
        validate?: (params: string) => boolean
        render?: (tokens: any[], idx: number) => string
        marker?: string
        minMarkerCount?: number
    }

    function container(md: MarkdownIt, name: string, opts?: ContainerOpts): void
    export default container
}