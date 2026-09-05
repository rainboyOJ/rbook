import MarkdownIt from 'markdown-it'
import container from 'markdown-it-container'
import type { Token } from 'markdown-it'

type ContainerDef = [name: string, validate: (params: string) => boolean, opener: () => string, closer: () => string]

const CONTAINERS: ContainerDef[] = [
    ['oneWordAlgo',
        p => /^onewordalgo$/i.test(p.trim()),
        () => `<div class="oneWordAlgo">\n<div class="title"><span>一句话算法</span></div><div class="content">`,
        () => '</div></div>\n',
    ],
    ['colorfulbox',
        p => /^colorfulbox$/i.test(p.trim()),
        () => `<div class="colorfulbox bg-light">\n`,
        () => '</div>\n',
    ],
    ['blackboard',
        p => /^blackboard/i.test(p.trim()),
        () => `<div class="blackboard">\n<div class="blackboard-content">`,
        () => '</div></div>\n',
    ],
    ['fold',
        p => /^fold/i.test(p.trim()),
        () => '<details><summary> 点击 </summary>\n<article>',
        () => '</article></details>\n',
    ],
]

const DEFAULT_CONTAINERS: ContainerDef[] = [
    ['warning', p => /^warning/i.test(p.trim()), () => `<div class="warning">\n<div class="title-icon"></div>\n`, () => '</div>\n'],
    ['error', p => /^error/i.test(p.trim()), () => `<div class="error">\n<div class="title-icon"></div>\n`, () => '</div>\n'],
    ['info', p => /^info/i.test(p.trim()), () => `<div class="info">\n<div class="title-icon"></div>\n`, () => '</div>\n'],
]

export default function containersPlugin(md: MarkdownIt): void {
    for (const [name, validate, opener, closer] of [...CONTAINERS, ...DEFAULT_CONTAINERS]) {
        md.use(container, name, {
            validate,
            render(tokens: Token[], idx: number) {
                return tokens[idx].nesting === 1 ? opener() : closer()
            },
        })
    }
}