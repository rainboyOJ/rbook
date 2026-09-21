export interface AnimationContext {
    /** Shadow DOM 内的独立挂载根节点。 */
    root: HTMLElement
    /** 登记事件、计时器或绘图库实例的清理函数。 */
    onCleanup(cleanup: () => void): void
}

export interface AnimationModule {
    mount(context: AnimationContext): void | Promise<void>
}
