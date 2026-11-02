export interface PointerFrame {
    readonly left: number
    readonly right: number
    readonly sum: number
    readonly best?: number
}

/** values 已按非递减顺序排列；每次移动后的状态独立保存。 */
export function buildPairFrames(values: readonly number[], target: number): readonly PointerFrame[] {
    let left = 0, right = values.length - 1
    const frames: PointerFrame[] = []
    while (left < right) {
        const sum = values[left] + values[right]
        frames.push({ left, right, sum })
        if (sum === target) return frames
        if (sum < target) left++
        else right--
    }
    frames.push({ left, right, sum: 0 })
    return frames
}

/** values 为正整数；空窗口的 left > right，尚无可行解时 best = 0。 */
export function buildWindowFrames(values: readonly number[], target: number): readonly PointerFrame[] {
    let left = 0, sum = 0, best = Infinity
    const frames: PointerFrame[] = [{ left, right: -1, sum, best: 0 }]
    const record = (right: number) => {
        if (sum >= target) best = Math.min(best, right - left + 1)
        frames.push({ left, right, sum, best: Number.isFinite(best) ? best : 0 })
    }
    for (let right = 0; right < values.length; right++) {
        sum += values[right]
        record(right)
        while (left <= right && sum >= target) {
            sum -= values[left++]
            record(right)
        }
    }
    return frames
}
