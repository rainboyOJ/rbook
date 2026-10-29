import type { AnimationContext } from '@rbook/animation'
import { decompose, parseTree, PRESETS, type HldTree } from './hld-model'
import { tidyLayout } from './tidy-tree'

const STYLES = `
:host { display:block; color:#222; font-family:Georgia,"Noto Serif CJK SC","Songti SC",SimSun,serif; }
* { box-sizing:border-box; }
.hld { margin:24px 0; border:1px solid #aaa; background:#fff; overflow:hidden; font-size:14px; line-height:1.7; }
.heading { padding:18px 24px 14px; border-bottom:1px solid #aaa; text-align:center; }
h3 { margin:0; font-size:21px; font-weight:600; }
p { margin:6px 0; }
.muted { color:#555; }
.content { padding:18px 24px; }
button,select,textarea,summary,.toolbar,.zoom,.mode { font-family:system-ui,sans-serif; font-size:13px; }
button,select { min-height:40px; border:1px solid #999; border-radius:0; background:#fff; color:#222; padding:6px 12px; }
button { cursor:pointer; }
button:hover { background:#eee; border-color:#222; }
button:disabled { opacity:.45; cursor:default; }
:is(button,select,textarea,summary,[role=button]):focus-visible { outline:2px solid #222; outline-offset:3px; }
.toolbar { display:flex; gap:12px; align-items:end; flex-wrap:wrap; }
.preset-label { display:grid; gap:5px; flex:1; min-width:170px; font-weight:600; }
select { width:100%; font-weight:400; }
.generate { border-color:#222; border-width:1.5px; font-weight:600; padding-inline:22px; }
details.input { margin:12px 0; padding:8px 0; border-bottom:1px solid #ddd; }
summary { cursor:pointer; min-height:28px; }
.input-grid { display:grid; grid-template-columns:minmax(140px,1fr) minmax(160px,1fr); gap:16px; padding-top:10px; }
textarea { display:block; width:100%; height:170px; resize:vertical; border:1px solid #999; border-radius:0; padding:10px; color:#222; background:#fff; line-height:1.5; font-family:ui-monospace,monospace; }
.input-help { font-size:13px; }
.input-help code { color:#222; font-family:ui-monospace,monospace; }
.draft { font-size:13px; color:#555; }
.error { color:#222; border:1px solid #555; border-left-width:3px; padding:8px 12px; font-family:system-ui,sans-serif; }
.error:empty,.draft:empty { display:none; }
.summary { margin:14px 0 10px; text-align:center; font-size:13px; }
.visual { border-top:1px solid #aaa; border-bottom:1px solid #aaa; }
.visual-head { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; padding:8px 0; }
.legend { display:flex; align-items:center; flex-wrap:wrap; gap:14px; font-size:12px; color:#444; }
.legend span { display:inline-flex; align-items:center; gap:6px; }
.line { display:inline-block; width:23px; border-top:3px solid #222; }
.line.light { border-top:1px dashed #888; }
.zoom { display:flex; align-items:center; flex-wrap:wrap; gap:5px; }
.zoom button { min-width:34px; min-height:34px; padding:3px 7px; font-size:12px; }
.zoom output { min-width:38px; text-align:center; font-size:12px; color:#555; }
.viewport { max-height:540px; min-height:160px; overflow:auto; background:#fff; overscroll-behavior:contain; }
svg { display:block; margin:0 auto; overflow:visible; }
.edge { fill:none; stroke-linecap:butt; }
.node { cursor:pointer; }
.node .outline { fill:#fff; stroke:#222; stroke-width:1.4; }
.node .number { fill:#222; font-family:Georgia,"Times New Roman",serif; font-size:19px; }
.node .active-ring { fill:none; stroke:#222; stroke-width:1.3; visibility:hidden; }
.node.selected .active-ring,.node:focus-visible .active-ring { visibility:visible; }
.node.same-chain .outline,.node.in-subtree .outline { fill:#e5e5e5; }
.node:hover .outline { stroke-width:2.2; }
.figure-caption { margin:0; padding:6px 0 10px; text-align:center; font-size:13px; }
.inspection { padding:12px 0; }
.inspection-head { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; }
.inspection-title { font-size:14px; font-weight:600; }
.mode { display:flex; gap:4px; }
.mode button { min-height:34px; padding:3px 10px; font-size:12px; }
.mode button[aria-pressed=true] { background:#e5e5e5; border-color:#222; text-decoration:underline; text-underline-offset:4px; }
.explanation { font-size:13px; overflow-wrap:anywhere; }
h4 { margin:18px 0 8px; font-size:14px; font-weight:600; }
.order-scroll { overflow:auto; padding:3px 3px 8px; }
.order { display:flex; width:max-content; }
.order-cell { display:grid; justify-items:center; gap:0; min-width:44px; padding:4px 8px; border:0; border-block:1px solid #888; border-right:1px solid #ccc; font-family:Georgia,"Times New Roman",serif; font-variant-numeric:tabular-nums; }
.order-cell:first-child { border-left:1px solid #ccc; }
.order-cell .position { font-size:11px; color:#555; }
.order-cell strong { font-size:17px; font-weight:400; }
.order-cell.same-chain,.order-cell.in-subtree { background:#e5e5e5; }
.order-cell.selected { outline:2px solid #222; outline-offset:-2px; }
.chains { display:flex; gap:4px 18px; flex-wrap:wrap; }
.chain-button { border:0; border-bottom:1px solid #aaa; font-size:13px; min-height:36px; padding:3px 0; max-width:100%; overflow-wrap:anywhere; text-align:left; font-family:inherit; }
.chain-button[aria-pressed=true] { border-bottom:2px solid #222; font-weight:600; }
.table-wrap { overflow:auto; max-height:340px; border-top:2px solid #222; border-bottom:2px solid #222; }
table { width:100%; border-collapse:separate; border-spacing:0; text-align:center; font-variant-numeric:tabular-nums; font-size:14px; }
.table-heading { text-align:center; margin:4px 0 8px; font-weight:400; }
th,td { padding:6px 10px; white-space:nowrap; }
th { background:#fff; position:sticky; top:0; z-index:1; border-bottom:1px solid #555; font-weight:400; }
th em { font-family:Georgia,"Times New Roman",serif; }
td { border-bottom:1px solid #e5e5e5; }
tbody tr:last-child td { border-bottom:0; }
td button { min-height:30px; padding:0 12px; border:0; background:transparent; font:inherit; }
tr.same-chain,tr.in-subtree { background:#f3f3f3; }
tr.selected { background:#ddd; }
tr.selected td:first-child { box-shadow:inset 2px 0 #222; }
.table-note,.footer { color:#555; font-size:12px; }
.footer { margin-top:16px; padding-top:10px; border-top:1px solid #ccc; }
@media(max-width:560px) {
 .heading { padding:14px; } .content { padding:12px; }
 .input-grid { grid-template-columns:1fr; gap:8px; }
 .generate { padding-inline:14px; }
 button,select,.zoom button,.mode button { min-height:44px; }
 th,td { padding:6px 8px; }
 h3 { font-size:19px; }
}
@media print {
 .hld { border:0; color:#000; }
 form,.zoom,.mode { display:none; }
 .viewport,.table-wrap { max-height:none; overflow:visible; }
 .order-scroll { overflow:visible; }
 .order { flex-wrap:wrap; width:auto; }
 button { color:#000; }
}
`

export function mount(context: AnimationContext): void {
    const style = document.createElement('style')
    style.textContent = STYLES
    const shell = document.createElement('section')
    shell.className = 'hld'
    shell.innerHTML = `
      <header class="heading">
        <h3>重链剖分 · 结构与编号</h3>
        <p class="muted">选择数据生成划分，点击节点与下方属性表对照。</p>
      </header>
      <div class="content">
        <form>
          <div class="toolbar">
            <label class="preset-label">示例数据<select aria-label="示例数据"></select></label>
            <button type="submit" class="generate">生成划分</button>
          </div>
          <details class="input">
            <summary>查看 / 自定义树数据</summary>
            <div class="input-grid">
              <label>树数据<textarea aria-label="树数据" spellcheck="false" maxlength="20000"></textarea></label>
              <div class="input-help muted">
                <p>第一行：<code>n root</code>（节点数、根）。</p>
                <p>接下来 <code>n − 1</code> 行：每行一条无向边 <code>u v</code>，以空格分隔。</p>
                <p>节点编号为 <code>1 … n</code>，支持 1～80 个节点。修改第一行的根，可以观察同一棵树的另一种划分。</p>
                <p>输入完成后点击「生成划分」。</p>
              </div>
            </div>
          </details>
          <p class="draft" role="status"></p>
          <p class="error" role="alert"></p>
        </form>
        <p class="summary" role="status"></p>
        <div class="visual">
          <div class="visual-head">
            <div class="legend"><span><i class="line"></i>重边</span><span><i class="line light"></i>轻边</span></div>
            <div class="zoom" aria-label="树图缩放">
              <button type="button" data-zoom="out" aria-label="缩小">−</button>
              <output aria-label="缩放比例"></output>
              <button type="button" data-zoom="in" aria-label="放大">＋</button>
              <button type="button" data-zoom="fit">适应画布</button>
              <button type="button" data-zoom="actual">原大</button>
            </div>
          </div>
          <div class="viewport" tabindex="0" role="region" aria-label="树图，可滚动查看；点击节点查看属性">
            <svg xmlns="http://www.w3.org/2000/svg" role="group" aria-label="树链剖分结果"></svg>
          </div>
          <p class="figure-caption">图 1　重链剖分结果。双圈表示选中节点，灰底表示关联节点。</p>
        </div>
        <div class="inspection">
          <div class="inspection-head">
            <span class="inspection-title"></span>
            <div class="mode" role="group" aria-label="高亮范围">
              <button type="button" data-mode="chain" aria-pressed="true">所在重链</button>
              <button type="button" data-mode="subtree" aria-pressed="false">它的子树</button>
            </div>
          </div>
          <p class="explanation" aria-live="polite"></p>
        </div>
        <section class="attributes" aria-label="节点属性表">
          <h4 class="table-heading">表 1　节点属性</h4>
          <div class="table-wrap" tabindex="0" role="region" aria-label="全部节点属性，可滚动查看"><table aria-label="节点属性">
            <thead><tr><th scope="col">节点</th><th scope="col"><em>top</em></th><th scope="col"><em>size</em></th><th scope="col"><em>son</em></th><th scope="col"><em>dfn</em></th><th scope="col">子树区间</th></tr></thead>
            <tbody></tbody>
          </table></div>
          <p class="table-note">按原编号排列。top：链头；size：子树大小；son：重儿子（— 表示无）；dfn：新编号。点击编号可选中节点。</p>
        </section>
        <h4>DFS 序</h4>
        <p class="muted">上行为位置 dfn，下行为原节点编号。</p>
        <div class="order-scroll" tabindex="0" role="region" aria-label="DFS 序，可横向滚动"><div class="order"></div></div>
        <h4>重链列表</h4>
        <div class="chains" aria-label="点击选择一条重链"></div>
        <p class="footer">size 对应正文的 sz，重儿子对应 son。子树一样大时选输入中先出现的儿子；轻儿子按输入顺序访问，与本文模板一致。重链不一定在图的最左侧，同一条链也不一定竖直。</p>
      </div>
    `
    context.root.append(style, shell)
    const get = <T extends Element>(selector: string) => shell.querySelector<T>(selector)!
    const select = get<HTMLSelectElement>('select')
    PRESETS.forEach((preset, i) => select.add(new Option(preset.title, String(i))))
    select.add(new Option('自定义数据', 'custom'))
    const input = get<HTMLTextAreaElement>('textarea')
    const error = get<HTMLElement>('.error'), draft = get<HTMLElement>('.draft')
    const viewport = get<HTMLElement>('.viewport'), svg = get<SVGSVGElement>('svg')
    const order = get<HTMLElement>('.order'), chains = get<HTMLElement>('.chains')
    const tbody = get<HTMLElement>('tbody')
    const abort = new AbortController()
    // One abort releases all form, delegated click and keyboard listeners.
    context.onCleanup(() => { abort.abort(); style.remove(); shell.remove() })

    let tree: HldTree
    let selected = 1
    let mode: 'chain' | 'subtree' = 'chain'
    let width = 0, height = 0, scale = 1, fitting = true

    function resize() {
        if (!tree) return
        if (fitting) scale = Math.min(1, Math.max(180, viewport.clientWidth - 2) / width, 520 / height)
        svg.setAttribute('width', String(width * scale))
        svg.setAttribute('height', String(height * scale))
        get<HTMLOutputElement>('.zoom output').value = `${Math.round(scale * 100)}%`
    }

    function inspect(u: number) {
        selected = u
        const head = tree.top[u], left = tree.dfn[u], right = left + tree.size[u] - 1
        for (const element of shell.querySelectorAll<HTMLElement | SVGElement>('[data-node]')) {
            const v = Number(element.dataset.node)
            element.classList.toggle('selected', v === u)
            element.classList.toggle('same-chain', mode === 'chain' && tree.top[v] === head)
            element.classList.toggle('in-subtree', mode === 'subtree' && tree.dfn[v] >= left && tree.dfn[v] <= right)
            if (element.matches('button,[role=button]')) element.setAttribute('aria-pressed', String(v === u))
        }
        for (const element of chains.querySelectorAll<HTMLButtonElement>('button')) {
            element.setAttribute('aria-pressed', String(Number(element.dataset.chain) === head))
        }
        get<HTMLElement>('.inspection-title').textContent = `节点 ${u}${u === tree.root ? ' · 根' : ''}${u === head ? ' · 链头' : ''}`
        // Reveal the selected row within the table without moving the article.
        const row = tbody.querySelector<HTMLElement>(`tr[data-node="${u}"]`)!
        const tableViewport = get<HTMLElement>('.table-wrap')
        const bounds = tableViewport.getBoundingClientRect(), rowBounds = row.getBoundingClientRect()
        const headerHeight = get<HTMLElement>('thead').getBoundingClientRect().height
        if (rowBounds.top < bounds.top + headerHeight) tableViewport.scrollTop += rowBounds.top - bounds.top - headerHeight
        else if (rowBounds.bottom > bounds.bottom) tableViewport.scrollTop += rowBounds.bottom - bounds.bottom
        const chain = tree.chains.find(nodes => nodes[0] === head)!
        get<HTMLElement>('.explanation').textContent = mode === 'chain'
            ? `所在重链：${chain.join(' → ')}；top 都是 ${head}，dfn 连续占据 [${tree.dfn[head]}, ${tree.dfn[chain.at(-1)!]}]。${tree.heavy[u] ? `节点 ${u} 的重儿子是 ${tree.heavy[u]}。` : `节点 ${u} 是叶子，没有重儿子。`}`
            : `节点 ${u} 的子树共有 ${tree.size[u]} 个点，恰好占据 dfn 区间 [${left}, ${right}]，即 [dfn[${u}], dfn[${u}] + size[${u}] − 1]。树图、属性表和下方序列中的灰底节点一一对应。`
    }

    function render() {
        const positions = tidyLayout(tree.children, tree.root)
        const xs = positions.slice(1).map(p => p.x)
        const minX = Math.min(...xs), maxX = Math.max(...xs)
        const radius = 20, margin = 36
        width = (maxX - minX) * 82 + margin * 2
        height = Math.max(...tree.depth) * 86 + margin * 2
        const point = (u: number) => ({ x: (positions[u].x - minX) * 82 + margin, y: positions[u].y * 86 + margin })
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
        const edges: string[] = [], nodes: string[] = []
        for (let u = 1; u <= tree.n; u++) {
            const p = point(u), parent = tree.parent[u]
            if (parent) {
                const q = point(parent), heavy = tree.heavy[parent] === u
                const length = Math.hypot(p.x - q.x, p.y - q.y)
                const dx = (p.x - q.x) * radius / length, dy = (p.y - q.y) * radius / length
                edges.push(`<path class="edge" d="M ${q.x + dx} ${q.y + dy} L ${p.x - dx} ${p.y - dy}" stroke="${heavy ? '#222' : '#888'}" stroke-width="${heavy ? 3 : 1.2}" ${heavy ? '' : 'stroke-dasharray="4 4"'}><title>${parent} → ${u}：${heavy ? '重边' : '轻边'}</title></path>`)
            }
            const accessible = `节点 ${u}，top ${tree.top[u]}，size ${tree.size[u]}，重儿子 ${tree.heavy[u] || '无'}，dfn ${tree.dfn[u]}`
            nodes.push(`<g class="node" data-node="${u}" role="button" tabindex="0" aria-label="${accessible}" aria-pressed="false" transform="translate(${p.x},${p.y})">
              <title>节点 ${u}，点击查看下方属性表</title>
              <circle class="active-ring" r="25"/>
              <circle class="outline" r="${radius}"/>
              <text class="number" y="1" text-anchor="middle" dominant-baseline="middle">${u}</text>
            </g>`)
        }
        svg.innerHTML = `<title>以 ${tree.root} 为根的树，共 ${tree.chains.length} 条重链</title>${edges.join('')}${nodes.join('')}`
        order.innerHTML = tree.rev.slice(1).map(u => `<button type="button" class="order-cell" data-node="${u}" aria-label="dfn ${tree.dfn[u]}，节点 ${u}"><span class="position">${tree.dfn[u]}</span><strong>${u}</strong></button>`).join('')
        chains.innerHTML = tree.chains.map(chain => `<button type="button" class="chain-button" data-chain="${chain[0]}">top ${chain[0]}：${chain.join(' → ')}</button>`).join('')
        tbody.innerHTML = Array.from({ length: tree.n }, (_, i) => {
            const u = i + 1
            return `<tr data-node="${u}"><td><button type="button" data-node="${u}" aria-label="查看节点 ${u}">${u}</button></td><td>${tree.top[u]}</td><td>${tree.size[u]}</td><td>${tree.heavy[u] || '—'}</td><td>${tree.dfn[u]}</td><td>[${tree.dfn[u]}, ${tree.dfn[u] + tree.size[u] - 1}]</td></tr>`
        }).join('')
        get<HTMLElement>('.summary').textContent = `${tree.n} 个节点 · 根 ${tree.root} · ${tree.chains.length} 条重链 · ${tree.n - tree.chains.length} 条重边 · ${tree.chains.length - 1} 条轻边`
        fitting = true
        resize()
        viewport.scrollTo(0, 0)
        get<HTMLElement>('.order-scroll').scrollTo(0, 0)
        inspect(tree.root)
    }

    function generate() {
        try {
            const next = decompose(parseTree(input.value))
            tree = next
            render()
            error.textContent = ''
            draft.textContent = ''
            input.removeAttribute('aria-invalid')
        } catch (reason) {
            error.textContent = reason instanceof Error ? reason.message : String(reason)
            input.setAttribute('aria-invalid', 'true')
            get<HTMLDetailsElement>('.input').open = true
        }
    }

    get<HTMLFormElement>('form').addEventListener('submit', event => {
        event.preventDefault()
        generate()
    }, { signal: abort.signal })
    select.addEventListener('change', () => {
        if (select.value !== 'custom') {
            input.value = PRESETS[Number(select.value)].input
            generate()
            return
        }
        get<HTMLDetailsElement>('.input').open = true
        draft.textContent = '数据尚未应用，点击「生成划分」更新树图。'
        error.textContent = ''
        input.removeAttribute('aria-invalid')
        input.focus()
    }, { signal: abort.signal })
    input.addEventListener('input', () => {
        select.value = 'custom'
        draft.textContent = '数据尚未应用，点击「生成划分」更新树图。'
    }, { signal: abort.signal })
    shell.addEventListener('click', event => {
        const target = event.target as Element
        const node = target.closest<HTMLElement | SVGElement>('[data-node]')
        if (node) inspect(Number(node.dataset.node))
        const chain = target.closest<HTMLButtonElement>('[data-chain]')
        if (chain) {
            setMode('chain')
            inspect(Number(chain.dataset.chain))
        }
        const toggle = target.closest<HTMLButtonElement>('[data-mode]')
        if (toggle) setMode(toggle.dataset.mode as 'chain' | 'subtree')
        const zoom = target.closest<HTMLButtonElement>('[data-zoom]')?.dataset.zoom
        if (zoom) {
            fitting = zoom === 'fit'
            if (zoom === 'actual') scale = 1
            if (zoom === 'in') scale = Math.min(2, scale * 1.3)
            if (zoom === 'out') scale = Math.max(.01, scale / 1.3)
            resize()
        }
    }, { signal: abort.signal })
    svg.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        const node = (event.target as Element).closest<SVGElement>('[data-node]')
        if (node) { event.preventDefault(); inspect(Number(node.dataset.node)) }
    }, { signal: abort.signal })
    function setMode(next: 'chain' | 'subtree') {
        mode = next
        for (const button of shell.querySelectorAll<HTMLButtonElement>('[data-mode]')) {
            button.setAttribute('aria-pressed', String(button.dataset.mode === mode))
        }
        inspect(selected)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(viewport)
    context.onCleanup(() => observer.disconnect())
    input.value = PRESETS[0].input
    generate()
}
