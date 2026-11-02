import type { AnimationContext } from '@rbook/animation'
import { mountPointerFigure } from './pointer-figure'
import { buildWindowFrames } from './pointer-model'

export function mount(context: AnimationContext): void {
    const values = [2, 3, 1, 2, 4, 3]
    const target = 7
    mountPointerFigure(context, {
        kind: 'window', title: '滑动窗口 · 扩展与收缩', values, target,
        frames: buildWindowFrames(values, target),
    })
}
