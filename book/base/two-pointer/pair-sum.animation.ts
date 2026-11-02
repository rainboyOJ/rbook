import type { AnimationContext } from '@rbook/animation'
import { mountPointerFigure } from './pointer-figure'
import { buildPairFrames } from './pointer-model'

export function mount(context: AnimationContext): void {
    const values = [4, 5, 6, 9, 13, 21, 23, 32, 65]
    const target = 37
    mountPointerFigure(context, {
        kind: 'pair', title: '两数之和 · 排除候选', values, target,
        frames: buildPairFrames(values, target),
    })
}
