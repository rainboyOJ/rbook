# 在 Markdown 中嵌入 TypeScript 交互动画

本文介绍 Rbook 的交互动画机制，以及如何为一篇文章编写自己的 TypeScript 动画。读完后，你应该能够：

- 在 Markdown 中引用一个动画模块；
- 编写符合 Rbook 约定的 `mount(context)` 入口；
- 使用 Canvas、SVG 或普通 HTML 绘制交互界面；
- 使用快照播放器实现前进、后退、播放和重置；
- 正确处理输入、响应式布局和资源清理；
- 在开发服务器和静态发布环境中验证动画。

## 最小示例

动画属于文章目录。推荐把 Markdown 和动画入口放在一起：

```text
book/recursion/binary_search/
├── index.md
└── binary-search.animation.ts
```

在 `index.md` 中写：

```md
[[[animate: ./binary-search.animation.ts]]]
```

路径相对于写下这段引用的 Markdown 文件解析。如果引用出现在一个通过 `[[[include: ...]]]` 引入的片段中，路径相对于那个片段解析，而不是相对于最外层文章解析。

动画入口文件必须以 `.animation.ts` 结尾，并导出 `mount`：

```ts
import type { AnimationContext } from '@rbook/animation'

export function mount(context: AnimationContext): void {
    const title = document.createElement('h3')
    title.textContent = '我的第一个动画'
    context.root.append(title)
}
```

这已经是一个有效动画。`context.root` 是专属于当前实例的挂载节点。

## 整体工作原理

整个流程分成四层：

```text
Markdown 源文件
    │  [[[animate: ./demo.animation.ts]]]
    ▼
Markdown 插件
    │  检查路径，生成 data-animation-module
    ▼
Vite / Rollup
    │  编译 TypeScript 和依赖
    ▼
浏览器运行时
    │  import(moduleUrl)，创建 Shadow DOM，调用 mount
    ▼
动画实例
```

### 1. Markdown 插件只生成挂载点

`src/publishing/markdown/plugins/animate.ts` 负责解析动画引用。它不会把 TypeScript 源码直接放进 HTML，也不会在 Node.js 中执行动画。它首先检查：

- 当前 Markdown 文件位置是否已知；
- 目标是否位于 `book/` 根目录内；
- 文件是否存在；
- 文件名是否以 `.animation.ts` 结尾。

检查通过后，源码路径会转换成稳定的浏览器模块 URL，例如：

```html
<div class="rbook-animation"
     data-animation-module="/animations/recursion/binary_search/binary-search.js">
  <p class="rbook-animation__loading">交互动画加载中...</p>
</div>
```

检查失败时，页面会显示可见的失败标记，同时发布诊断记录 `error`。这样错误不会静默变成一个空白区域。

### 2. 构建阶段把动画作为 Vite 入口

`vite.config.js` 会扫描 `book/` 下所有 `.animation.ts` 文件，把它们注册为 Rollup 入口。比如：

```text
book/recursion/binary_search/binary-search.animation.ts
```

会产出：

```text
dist/animations/recursion/binary_search/binary-search.js
```

动画入口必须保留导出，构建配置使用 `preserveEntrySignatures: 'strict'`，因此浏览器可以执行：

```js
const module = await import('/animations/recursion/binary_search/binary-search.js')
module.mount(context)
```

动画代码由 `tsconfig.animations.json` 单独进行类型检查。这个配置包含 `packages/animation/src/**/*.ts` 和 `book/**/*.animation.ts`。

### 3. 浏览器运行时负责挂载和销毁

文章模板 `src/ejs/article.html` 加载 `/js/animation-runtime.js`。运行时对每个动画挂载点执行以下操作：

1. 创建一个 `ShadowRoot`；
2. 在 Shadow DOM 中创建真正的 `root` 元素；
3. 动态 `import()` 动画模块；
4. 调用模块的 `mount(context)`；
5. 收集动画注册的清理函数；
6. 页面离开时按逆序执行清理函数。

Shadow DOM 让动画的局部 CSS 不会污染正文，也让正文的样式不会意外改变动画按钮和布局。每个挂载点都是独立实例，同一个动画文件引用多次也不会共享状态。

### 公共代码包

公共代码位于 npm workspace 包 `@rbook/animation`：

```text
packages/animation/
├── package.json
└── src/
    ├── index.ts
    ├── types.ts
    ├── snapshot-player.ts
    └── runtime.ts
```

文章动画只从根入口导入公共能力：

```ts
import {
    createSnapshotPlayer,
    type AnimationContext,
} from '@rbook/animation'
```

包的根入口提供类型和播放器；`@rbook/animation/runtime` 是站点模板使用的内部入口，不需要在每个动画文件中导入。`runtime.ts` 被 Vite 输出为固定的 `/js/animation-runtime.js`。

公共包不能依赖 `book/` 或 `src/publishing/`。依赖方向应保持为：

```text
packages/animation
        ↑
book/**/**.animation.ts
        ↑
Markdown 引用
```

根项目通过 npm workspace 管理公共包。修改公共动画代码后，使用以下命令分别验证包、文章动画和全部项目：

```bash
npm run typecheck:packages
npm run test:packages
npm run typecheck:animations
npm run typecheck
npm test
```

`packages/animation/tsconfig.json` 让公共包可以脱离文章代码单独检查。包内测试覆盖播放器的初始状态、前进和后退、步骤替换以及销毁清理，同时检查包源码没有反向依赖 `book/` 或 `src/publishing/`。新增公共能力时，应先放入 `packages/animation/src/` 并从 `src/index.ts` 导出；文章专属的算法步骤和绘图仍留在对应的 `.animation.ts` 文件中。

## 动画模块接口

公共接口在 `packages/animation/src/types.ts`，文章通过 `@rbook/animation` 使用它：

```ts
export interface AnimationContext {
    root: HTMLElement
    onCleanup(cleanup: () => void): void
}

export interface AnimationModule {
    mount(context: AnimationContext): void | Promise<void>
}
```

动画作者只需要理解两个字段。

### `root`

所有 DOM 都应该挂到 `root` 或它的后代上：

```ts
const panel = document.createElement('section')
panel.className = 'panel'
context.root.append(panel)
```

不要在动画里使用全局 `document.body`、固定的全局 ID 或全局变量来寻找自己的元素。这样做会让同一个动画无法安全地创建第二个实例。

### `onCleanup`

凡是需要主动释放的资源，都要登记清理函数：

```ts
const timer = window.setInterval(update, 1000)
const onResize = () => redraw()
window.addEventListener('resize', onResize)

context.onCleanup(() => window.clearInterval(timer))
context.onCleanup(() => window.removeEventListener('resize', onResize))
```

常见需要清理的资源包括定时器、动画帧、事件监听、`ResizeObserver`、`IntersectionObserver`，以及绘图库创建的实例。

## 推荐的动画内部结构

一个可维护的探索式算法动画通常分成四部分：

```text
输入解析与校验
        ↓
纯算法函数：生成不可变步骤
        ↓
播放器：选择当前步骤
        ↓
绘制函数：把当前步骤画出来
```

这种分工有三个好处：算法可以单独测试；后退不需要编写“逆向算法”；绘图层不负责偷偷修改算法状态。

## 使用快照播放器

`packages/animation/src/snapshot-player.ts` 提供通用的步骤播放器。文章动画从 `@rbook/animation` 导入它：

```ts
import {
    createSnapshotPlayer,
    type SnapshotPlayer,
} from '@rbook/animation'

interface Step {
    readonly left: number
    readonly right: number
    readonly message: string
}

let player: SnapshotPlayer<Step>

player = createSnapshotPlayer({
    root: playerRoot,
    steps: buildSteps(values, target),
    render(step, context) {
        draw(canvas, values, target, step)
        message.textContent = step.message
    },
})

player.replaceSteps(buildSteps(nextValues, nextTarget))
player.reset()
context.onCleanup(() => player.destroy())
```

播放器自动生成重置、上一步、下一步、播放、暂停、速度选择和当前步骤计数。`steps` 至少需要包含一个状态。每个状态最好是不可变对象：

```ts
const step = Object.freeze({
    left: 0,
    right: 5,
    message: '当前候选区间为 [1, 6]',
})
```

步骤应该代表教学上的清晰变化。例如二分查找把一轮拆成：初始区间、选择 `mid`、展示比较结果、更新候选区间、得到答案。视觉上的移动和变色属于 `draw()`，不应该改变快照本身。

## Canvas 动画的写法

Canvas 适合大量图形或需要精确控制绘制的场景。一个基础绘制函数可以这样写：

```ts
function draw(canvas: HTMLCanvasElement, step: Step): void {
    const width = Math.max(280, Math.floor(canvas.clientWidth))
    const height = Math.max(180, Math.floor(canvas.clientHeight))
    const scale = Math.max(1, window.devicePixelRatio || 1)

    canvas.width = Math.floor(width * scale)
    canvas.height = Math.floor(height * scale)

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.scale(scale, scale)
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = '#172033'
    ctx.fillText(`区间: [${step.left}, ${step.right}]`, 16, 24)
}
```

这里有两个重要细节：CSS 尺寸和 Canvas 的像素尺寸分开处理；使用 `devicePixelRatio`，避免高分辨率屏幕上的文字和线条模糊。

如果画布需要随容器变化，使用 `ResizeObserver`：

```ts
const observer = new ResizeObserver(() => {
    if (currentStep) draw(canvas, currentStep)
})
observer.observe(canvas)
context.onCleanup(() => observer.disconnect())
```

## 输入、校验和重新开始

建议把输入控件当作草稿。用户点击“应用”后才解析和更新动画：

```ts
form.addEventListener('submit', event => {
    event.preventDefault()

    try {
        const nextValues = parseValues(valuesInput.value)
        const nextTarget = parseTarget(targetInput.value)

        values = nextValues
        target = nextTarget
        error.textContent = ''
        player.replaceSteps(buildSteps(values, target))
    }
    catch (reason) {
        error.textContent = reason instanceof Error ? reason.message : String(reason)
    }
})
```

校验失败时，不要覆盖当前有效演示。只显示错误，保留原来的步骤和画面。例如：

```ts
function parseValues(source: string): number[] {
    const parts = source.split(/[\s,，]+/).filter(Boolean)
    if (parts.length === 0) throw new Error('请输入至少一个数组元素。')

    const values = parts.map(Number)
    if (values.some(value => !Number.isFinite(value))) {
        throw new Error('数组只能包含有限数字。')
    }
    if (values.some((value, index) => index > 0 && values[index - 1] > value)) {
        throw new Error('数组必须按从小到大排列。')
    }
    return values
}
```

## 完整参考：二分查找动画

当前示例位于：

```text
book/recursion/binary_search/binary-search.animation.ts
```

它演示了完整流程：

1. 用输入框接受有序数组和目标值；
2. 用 `buildSteps()` 纯计算 lower_bound 的教学步骤；
3. 把末尾哨兵 `∞` 作为位置 `n + 1`；
4. 用快照播放器切换步骤；
5. 用 Canvas 绘制候选区间、`mid` 和最终答案；
6. 用 `ResizeObserver` 重新绘制响应式画面；
7. 用 `onCleanup()` 释放播放器和观察器。

其中算法步骤的核心是：

```ts
while (left < right) {
    const mid = Math.floor((left + right) / 2)
    const midValue = at(mid)

    if (midValue >= target) right = mid
    else left = mid + 1
}
```

这里的步骤是 lower_bound：寻找第一个 `>= target` 的位置，而不是遇到相等值就停止。编写其他算法时，应把算法的核心状态放入快照，把说明文字也放入快照，让学生知道每一步为什么发生。

## 编写其他动画的步骤

### 第一步：确定教学状态

先写出学生应该观察的状态，而不是先写 Canvas。例如归并排序可以定义：

```ts
interface MergeStep {
    readonly left: number
    readonly mid: number
    readonly right: number
    readonly comparing?: [number, number]
    readonly merged: readonly number[]
    readonly message: string
}
```

### 第二步：写纯步骤生成函数

```ts
function buildSteps(input: readonly number[]): readonly MergeStep[] {
    // 只计算步骤，不创建 DOM，不读取 window。
    return Object.freeze(steps)
}
```

### 第三步：创建 DOM 和输入控件

所有元素都创建在 `context.root` 内。不要依赖文章正文中存在某个 ID。

### 第四步：决定绘图技术

- Canvas：大量节点、网格、连线、连续运动；
- SVG：树、图、带标签的几何对象；
- HTML：表格、变量面板、表单和文本说明。

绘图技术是动画内部实现，Markdown 引用方式不变。

### 第五步：注册清理逻辑

动画无论是 Canvas 还是第三方库，都必须让 `mount()` 返回前完成资源登记：

```ts
context.onCleanup(() => {
    animationFrame && cancelAnimationFrame(animationFrame)
    chart?.destroy()
})
```

## 样式与移动端

动画在 Shadow DOM 内，可以在 TS 文件中放置局部 `<style>`：

```ts
const style = document.createElement('style')
style.textContent = `
  :host { display: block; font-family: system-ui, sans-serif; }
  .panel { max-width: 100%; overflow: hidden; }
  button { min-height: 36px; }
  @media (max-width: 620px) {
    .toolbar { flex-wrap: wrap; }
  }
`
context.root.append(style)
```

布局应允许正文宽度变化。固定格式的元素需要稳定尺寸，按钮需要足够大的点击区域，Canvas 要使用 `max-width: 100%`。窄屏上可以减少默认数据量、换行工具栏或把控件改成纵向布局。

## 开发、测试和发布

启动开发服务器：

```bash
npm run dev -- --port 4173
```

然后打开对应文章，例如：

```text
http://localhost:4173/recursion/binary_search/index.html
```

开发插件会直接调用文章渲染器，把 `book/` 下的 Markdown 作为真实文章返回。修改 `.md` 或 `.animation.ts` 后，Vite 会刷新页面并重新初始化动画；第一版不会保留刷新前的播放进度。

运行动画类型检查：

```bash
npm run typecheck:animations
```

运行全部测试：

```bash
npm test
```

构建核心发布产物：

```bash
npm run build:core
```

发布时至少检查三件事：

- 文章 HTML 中存在正确的 `data-animation-module`；
- `dist/animations/...js` 存在并导出 `mount`；
- 浏览器打开发布目录后，动画可以动态加载。

## 常见错误

如果 Markdown 构建阶段显示动画引用失败，按以下顺序检查：

1. 文件是否真的以 `.animation.ts` 结尾；
2. Markdown 相对路径是否以当前 Markdown 文件为基准；
3. 文件是否位于 `book/` 内；
4. 文件名大小写是否与磁盘一致。

如果页面显示“交互动画加载失败”，继续检查：

1. `npm run typecheck:animations` 是否通过；
2. `mount` 是否是命名导出，或者默认导出对象是否含 `mount` 方法；
3. 浏览器网络面板中 `/animations/...js` 是否返回成功；
4. `dist/animations/...js` 是否存在并保留了 `mount` 导出；
5. `mount()` 内是否抛出了运行时异常。

如果 Canvas 是空白的，检查：

- Canvas 是否拥有非零的 CSS 宽高；
- 是否在设置 `canvas.width`、`canvas.height` 后重新绘制；
- 是否拿到了非空的 `2d` 上下文；
- `ResizeObserver` 回调中是否仍保留当前步骤；
- 绘制坐标是否落在当前画布范围内。

如果动画在一篇文章中引用两次后发生串状态，通常是因为状态放在模块顶层。状态应该在 `mount()` 内创建：

```ts
// 错误：所有实例共享。
let currentIndex = 0

export function mount(context: AnimationContext) {
    // 正确：每次 mount 都创建自己的状态。
    let currentIndex = 0
}
```

## 不需要播放器的动画

播放器是可选工具，不是动画模块接口的一部分。拖动树节点、改变函数参数、编辑图结构等探索式动画可以只实现自己的交互：

```ts
export function mount(context: AnimationContext): void {
    const canvas = document.createElement('canvas')
    context.root.append(canvas)

    const onPointerMove = (event: PointerEvent) => {
        // 更新当前交互状态并重绘。
    }

    canvas.addEventListener('pointermove', onPointerMove)
    context.onCleanup(() => canvas.removeEventListener('pointermove', onPointerMove))
}
```

只要遵守 `mount(context)` 和清理约定，动画内部可以自由选择状态模型和绘图技术。

## 设计约束

这套机制刻意保持几个约束：

- Markdown 负责声明位置，TypeScript 负责行为；
- 动画实例不依赖全局 DOM；
- 播放器只处理步骤索引，不理解具体算法；
- 算法状态、绘图和输入校验可以分别测试；
- 旧 iframe 动画继续按旧方式工作，新动画使用本机制逐步迁移。

当一个动画值得被多篇文章复用时，可以把纯算法函数或绘图工具提取到公共模块，但文章仍然只需要引用一个 `.animation.ts` 入口。入口保持小，复杂度留在模块内部，文章作者不需要了解构建和运行时的细节。
