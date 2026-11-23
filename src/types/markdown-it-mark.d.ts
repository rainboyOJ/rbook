declare module 'markdown-it-mark' {
    import type MarkdownIt from 'markdown-it'

    function mark(md: MarkdownIt): void
    export default mark
}
