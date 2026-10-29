import type { AnimationContext } from '@rbook/animation'
import { decompose, parseTree, PRESETS, type HldTree } from './hld-model'
import { tidyLayout } from './tidy-tree'

const COLORS = ['#2563eb', '#c2410c', '#0f766e', '#9333ea', '#be185d', '#4d7c0f', '#4338ca', '#a16207']
const STYLES = `
:host { display:block; color:#172033; font-family:system-ui,-apple-system,"Segoe UI",sans-serif; }
* { box-sizing:border-box; }
.hld { margin:20px 0; border:1px solid #cbd5e1; border-radius:16px; background:#fff; overflow:hidden; font-size:14px; line-height:1.6; }
.heading { padding:20px 22px 14px; background:linear-gradient(120deg,#eff6ff,#f8fafc 70%); border-bottom:1px solid #e2e8f0; }
.eyebrow { margin:0 0 4px; color:#1d4ed8; font-size:11px; font-weight:750; letter-spacing:.12em; }
h3 { margin:0; font-size:22px; letter-spacing:-.03em; }
p { margin:6px 0; }
.muted { color:#526175; }
.content { padding:18px 20px; }
button,select,textarea { font:inherit; }
button,select { min-height:44px; border:1px solid #cbd5e1; border-radius:8px; background:#fff; color:#172033; padding:8px 12px; }
button { cursor:pointer; }
button:hover { background:#eff6ff; border-color:#93b5ec; }
button:disabled { opacity:.45; cursor:default; }
:is(button,select,textarea,summary,[role=button]):focus-visible { outline:3px solid #2563eb; outline-offset:3px; }
.toolbar { display:flex; gap:12px; align-items:end; flex-wrap:wrap; }
.preset-label { display:grid; gap:5px; flex:1; min-width:180px; font-weight:650; }
select { width:100%; font-weight:400; }
.generate { background:#1d4ed8; border-color:#1d4ed8; color:white; font-weight:700; padding-inline:24px; }
.generate:hover { background:#1e40af; color:white; }
details.input { margin:12px 0; border:1px solid #e2e8f0; border-radius:8px; padding:10px 12px; background:#f8fafc; }
summary { cursor:pointer; font-weight:600; min-height:28px; }
.input-grid { display:grid; grid-template-columns:minmax(140px,1fr) minmax(160px,1fr); gap:16px; padding-top:10px; }
textarea { display:block; width:100%; height:170px; resize:vertical; border:1px solid #94a3b8; border-radius:6px; padding:10px; color:#172033; background:white; line-height:1.5; font-family:ui-monospace,monospace; }
.input-help { font-size:13px; }
.input-help code { color:#1e40af; font-family:ui-monospace,monospace; }
.draft { font-size:13px; color:#92400e; min-height:0; }
.error { color:#991b1b; background:#fef2f2; border-radius:6px; padding:8px 12px; }
.error:empty,.draft:empty { display:none; }
.summary { color:#334155; margin:14px 0 10px; font-weight:600; }
.visual { border:1px solid #dbe3ee; border-radius:12px; overflow:hidden; }
.visual-head { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; padding:8px 12px; background:#f8fafc; border-bottom:1px solid #e2e8f0; }
.legend { display:flex; align-items:center; flex-wrap:wrap; gap:12px; font-size:12px; color:#475569; }
.legend span { display:inline-flex; align-items:center; gap:5px; }
.line { display:inline-block; width:23px; border-top:4px solid #2563eb; }
.line.light { border-top:2px dashed #64748b; }
.zoom { display:flex; align-items:center; flex-wrap:wrap; gap:5px; }
.zoom button { min-width:38px; min-height:36px; padding:4px 8px; font-size:12px; }
.zoom output { min-width:38px; text-align:center; font-size:12px; color:#475569; }
.viewport { max-height:540px; min-height:180px; overflow:auto; background-color:#fcfdff; background-image:radial-gradient(#cbd5e1 .7px,transparent .7px); background-size:16px 16px; overscroll-behavior:contain; }
svg { display:block; margin:0 auto; overflow:visible; }
.edge { fill:none; stroke-linecap:round; }
.node { cursor:pointer; }
.node .card { fill:#fff; stroke:var(--chain); stroke-width:1.8; }
.node .accent { fill:var(--chain); }
.node .number { fill:white; font-weight:750; font-size:14px; }
.node .node-caption { font-size:11px; fill:#475569; }
.node .metric { font:11px ui-monospace,monospace; fill:#334155; }
.node .active-ring { fill:none; stroke:#0f172a; stroke-width:2.5; visibility:hidden; }
.node.selected .active-ring,.node:focus-visible .active-ring { visibility:visible; }
.node.same-chain .card { fill:#eff6ff; stroke-width:3; }
.node.in-subtree .card { fill:#ecfdf5; }
.inspection { padding:14px; margin-top:12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; }
.inspection-head { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; }
.inspection-title { font-size:16px; font-weight:750; }
.mode { display:flex; gap:4px; }
.mode button { min-height:36px; padding:4px 10px; font-size:12px; }
.mode button[aria-pressed=true] { background:#172033; color:white; border-color:#172033; }
.metrics { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; margin:12px 0; }
.metric-card { padding:7px 10px; border:1px solid #e2e8f0; border-radius:7px; background:white; }
.metric-card dt { color:#526175; font-size:11px; }
.metric-card dd { margin:0; font-size:20px; font-weight:700; font-variant-numeric:tabular-nums; }
.explanation { font-size:13px; overflow-wrap:anywhere; }
h4 { margin:18px 0 8px; font-size:14px; }
.order-scroll { overflow:auto; padding:3px 3px 8px; }
.order { display:flex; gap:5px; width:max-content; }
.order-cell { display:grid; justify-items:center; gap:0; min-width:52px; padding:5px 8px; border-top:4px solid var(--chain); font-variant-numeric:tabular-nums; }
.order-cell .position { font-size:10px; color:#526175; }
.order-cell strong { font-size:17px; }
.order-cell .chain-top { font-size:10px; color:#526175; }
.order-cell.same-chain { background:#eff6ff; border-color:var(--chain); }
.order-cell.in-subtree { background:#dcfce7; border-bottom:3px solid #15803d; }
.order-cell.selected { outline:2px solid #172033; outline-offset:0; }
.chains { display:flex; gap:7px; flex-wrap:wrap; }
.chain-button { border-left:5px solid var(--chain); font-size:12px; min-height:36px; padding:5px 10px; max-width:100%; overflow-wrap:anywhere; text-align:left; }
.chain-button[aria-pressed=true] { background:#eff6ff; box-shadow:inset 0 0 0 1px var(--chain); }
.table-wrap { overflow:auto; max-height:310px; margin-top:8px; }
table { width:100%; border-collapse:collapse; text-align:center; font-variant-numeric:tabular-nums; font-size:12px; }
caption { text-align:left; color:#526175; padding-bottom:8px; }
th,td { padding:6px 10px; border-bottom:1px solid #e2e8f0; white-space:nowrap; }
th { background:#f1f5f9; position:sticky; top:0; }
td button { min-height:32px; padding:2px 12px; border-color:var(--chain); }
tr.selected { background:#eff6ff; }
.table-details { margin-top:16px; }
.footer { margin-top:12px; color:#526175; font-size:12px; }
@media(max-width:560px) {
 .heading { padding:16px; } .content { padding:12px; }
 .input-grid { grid-template-columns:1fr; gap:8px; }
 .metrics { grid-template-columns:repeat(2,minmax(0,1fr)); }
 .generate { padding-inline:16px; }
 .visual-head { padding:8px; } .zoom button { min-height:44px; }
 h3 { font-size:20px; }
}
`

export function mount(context: AnimationContext): void {
    const style = document.createElement('style')
    style.textContent = STYLES
    const shell = document.createElement('section')
    shell.className = 'hld'
    shell.innerHTML = `
      <header class="heading">
        <p class="eyebrow">HEAVY–LIGHT DECOMPOSITION</p>
        <h3>重链剖分后的树</h3>
        <p class="muted">选择数据，生成最终划分。点击节点，对照重链和 DFS 编号。</p>
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
            <div class="legend"><span><i class="line"></i>重边 · 同链同色</span><span><i class="line light"></i>轻边</span></div>
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
        </div>
        <div class="inspection">
          <div class="inspection-head">
            <span class="inspection-title"></span>
            <div class="mode" role="group" aria-label="高亮范围">
              <button type="button" data-mode="chain" aria-pressed="true">所在重链</button>
              <button type="button" data-mode="subtree" aria-pressed="false">它的子树</button>
            </div>
          </div>
          <dl class="metrics"></dl>
          <p class="explanation" aria-live="polite"></p>
        </div>
        <h4>按 dfn 排列的节点</h4>
        <p class="muted">上方是位置 dfn，中间是原节点，下方是链头 top。</p>
        <div class="order-scroll" tabindex="0" role="region" aria-label="DFS 序，可横向滚动"><div class="order"></div></div>
        <h4>重链列表</h4>
        <div class="chains" aria-label="点击选择一条重链"></div>
        <details class="table-details">
          <summary>所有节点的属性表</summary>
          <div class="table-wrap"><table>
            <caption>按原节点编号排列；点击节点编号与树图对照。叶子的重儿子记为 —。</caption>
            <thead><tr><th scope="col">节点</th><th scope="col">top</th><th scope="col">size</th><th scope="col">重儿子</th><th scope="col">dfn</th><th scope="col">子树区间</th></tr></thead>
            <tbody></tbody>
          </table></div>
        </details>
        <p class="footer">size 对应正文的 sz，重儿子对应 son。子树一样大时选输入中先出现的儿子；轻儿子按输入逆序访问，与本文模板一致。重链不一定在图的最左侧，同一条链也不一定竖直。</p>
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
    let colors = new Map<number, string>()
    let width = 0, height = 0, scale = 1, fitting = true
    const color = (u: number) => colors.get(tree.top[u])!

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
        get<HTMLElement>('.metrics').innerHTML = [
            ['top · 链头', head], ['size · 子树大小', tree.size[u]],
            ['重儿子 · son', tree.heavy[u] || '—'], ['dfn · 新编号', left],
        ].map(([label, value]) => `<div class="metric-card"><dt>${label}</dt><dd>${value}</dd></div>`).join('')
        const chain = tree.chains.find(nodes => nodes[0] === head)!
        get<HTMLElement>('.explanation').textContent = mode === 'chain'
            ? `所在重链：${chain.join(' → ')}；top 都是 ${head}，dfn 连续占据 [${tree.dfn[head]}, ${tree.dfn[chain.at(-1)!]}]。${tree.heavy[u] ? `节点 ${u} 的重儿子是 ${tree.heavy[u]}。` : `节点 ${u} 是叶子，没有重儿子。`}`
            : `节点 ${u} 的子树共有 ${tree.size[u]} 个点，恰好占据 dfn 区间 [${left}, ${right}]，即 [dfn[${u}], dfn[${u}] + size[${u}] − 1]。树图和下方序列中的绿色节点一一对应。`
    }

    function render() {
        colors = new Map(tree.chains.map((chain, i) => [chain[0], COLORS[i] ?? `hsl(${(i * 137.508) % 360} 62% 36%)`]))
        const positions = tidyLayout(tree.children, tree.root)
        const xs = positions.slice(1).map(p => p.x)
        const minX = Math.min(...xs), maxX = Math.max(...xs)
        const cardWidth = 124, cardHeight = 84
        width = (maxX - minX) * 154 + cardWidth + 44
        height = Math.max(...tree.depth) * 134 + cardHeight + 44
        const point = (u: number) => ({ x: (positions[u].x - minX) * 154 + 22, y: positions[u].y * 134 + 22 })
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
        const edges: string[] = [], nodes: string[] = []
        for (let u = 1; u <= tree.n; u++) {
            const p = point(u), parent = tree.parent[u]
            if (parent) {
                const q = point(parent), heavy = tree.heavy[parent] === u
                edges.push(`<path class="edge" d="M ${q.x + cardWidth / 2} ${q.y + cardHeight} L ${p.x + cardWidth / 2} ${p.y}" stroke="${heavy ? color(u) : '#64748b'}" stroke-width="${heavy ? 5 : 1.8}" ${heavy ? '' : 'stroke-dasharray="5 6"'}><title>${parent} → ${u}：${heavy ? '重边' : '轻边'}</title></path>`)
            }
            const accessible = `节点 ${u}，top ${tree.top[u]}，size ${tree.size[u]}，重儿子 ${tree.heavy[u] || '无'}，dfn ${tree.dfn[u]}`
            nodes.push(`<g class="node" data-node="${u}" role="button" tabindex="0" aria-label="${accessible}" aria-pressed="false" style="--chain:${color(u)}" transform="translate(${p.x},${p.y})">
              <title>${accessible}</title>
              <rect class="active-ring" x="-4" y="-4" width="${cardWidth + 8}" height="${cardHeight + 8}" rx="13"/>
              <rect class="card" width="${cardWidth}" height="${cardHeight}" rx="9"/>
              <rect class="accent" x="8" y="8" width="28" height="24" rx="6"/>
              <text class="number" x="22" y="25" text-anchor="middle">${u}</text>
              <text class="node-caption" x="44" y="24">${u === tree.top[u] ? '链头' : '链内节点'}${u === tree.root ? ' · 根' : ''}</text>
              <text class="metric" x="10" y="51">top ${tree.top[u]}</text><text class="metric" x="67" y="51">size ${tree.size[u]}</text>
              <text class="metric" x="10" y="71">son ${tree.heavy[u] || '—'}</text><text class="metric" x="67" y="71">dfn ${tree.dfn[u]}</text>
            </g>`)
        }
        svg.innerHTML = `<title>以 ${tree.root} 为根的树，共 ${tree.chains.length} 条重链</title>${edges.join('')}${nodes.join('')}`
        order.innerHTML = tree.rev.slice(1).map(u => `<button type="button" class="order-cell" data-node="${u}" style="--chain:${color(u)}" aria-label="dfn ${tree.dfn[u]}，节点 ${u}，链头 ${tree.top[u]}"><span class="position">dfn ${tree.dfn[u]}</span><strong>${u}</strong><span class="chain-top">top ${tree.top[u]}</span></button>`).join('')
        chains.innerHTML = tree.chains.map(chain => `<button type="button" class="chain-button" data-chain="${chain[0]}" style="--chain:${color(chain[0])}">top ${chain[0]}：${chain.join(' → ')}</button>`).join('')
        tbody.innerHTML = Array.from({ length: tree.n }, (_, i) => {
            const u = i + 1
            return `<tr data-node="${u}"><td><button type="button" data-node="${u}" style="--chain:${color(u)}" aria-label="查看节点 ${u}">${u}</button></td><td>${tree.top[u]}</td><td>${tree.size[u]}</td><td>${tree.heavy[u] || '—'}</td><td>${tree.dfn[u]}</td><td>[${tree.dfn[u]}, ${tree.dfn[u] + tree.size[u] - 1}]</td></tr>`
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
        get<HTMLDetailsElement>('.input').open = true
        if (select.value !== 'custom') input.value = PRESETS[Number(select.value)].input
        draft.textContent = '数据尚未应用，点击「生成划分」更新树图。'
        error.textContent = ''
        input.removeAttribute('aria-invalid')
        if (select.value === 'custom') input.focus()
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
