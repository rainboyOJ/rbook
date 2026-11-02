import { createSnapshotPlayer, type AnimationContext } from '@rbook/animation'

const initial = [1, 2, 3, 4] as const

function buildSteps() {
    const values: number[] = [...initial]
    const steps = [{ values: [...values], active: 0 }]
    for (let i = 0; i < initial.length - 1; i++) {
        values[i + 1] += values[i]
        steps.push({ values: [...values], active: i + 1 })
    }
    return steps
}

export function mount(context: AnimationContext): void {
    const style = document.createElement('style')
    style.textContent = `
      :host { display: block; color-scheme: light; color: #222;
        font-family: Georgia, "Noto Serif CJK SC", "Songti SC", SimSun, serif; }
      * { box-sizing: border-box; }
      .panel { margin: 24px 0; border: 1px solid #aaa; background: #fff;
        overflow: hidden; color: #222; font-size: 14px; line-height: 1.7; }
      .heading { padding: 18px 24px 14px; border-bottom: 1px solid #aaa; text-align: center; }
      h3 { margin: 0; font-size: 21px; font-weight: 600; }
      .content { padding: 18px 24px; }
      .visual { border-top: 1px solid #aaa; border-bottom: 1px solid #aaa; }
      .stage { position: relative; padding-top: 58px; }
      .cells { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
      .cell { min-width: 0; text-align: center; padding: 12px 4px 8px;
        border: 1px solid #888; background: #fff; }
      .cell.active { outline: 2px solid #222; outline-offset: -2px; background: #e5e5e5; }
      .label { color: #555; font-size: 14px; font-style: italic; }
      .label sub { font-style: normal; }
      .value { font-family: Georgia, "Times New Roman", serif;
        font-size: 32px; font-weight: 400; line-height: 1.4; font-variant-numeric: tabular-nums; }
      .source { color: #444; font-size: 13px; white-space: nowrap; }
      .packet { position: absolute; top: 8px; z-index: 1; padding: 0 6px;
        background: #fff; color: #222; font-size: 17px; }
      .route { position: absolute; top: 26px; border-top: 1px solid #222; }
      .route::after { content: ''; position: absolute; right: 0; top: -4px;
        width: 6px; height: 6px; border-top: 1px solid #222;
        border-right: 1px solid #222; transform: rotate(45deg); }
      [hidden] { display: none !important; }
      .figure-caption { margin: 0; padding: 10px 0; text-align: center; color: #555; font-size: 13px; }
      .controls { margin-top: 14px; padding-top: 10px; border-top: 1px solid #ccc; }
      .panel .snapshot-player__toolbar { margin-top: 0; gap: 8px; font: 13px/1.7 system-ui, sans-serif; }
      .panel .snapshot-player__button, .panel .snapshot-player__speed {
        min-height: 40px; height: auto; border: 1px solid #999; border-radius: 0;
        background: #fff; color: #222; padding: 6px 12px; }
      .panel .snapshot-player__button:hover:not(:disabled) { background: #eee; border-color: #222; }
      .panel .snapshot-player__button:focus-visible, .panel .snapshot-player__speed:focus-visible {
        outline: 2px solid #222; outline-offset: 3px; }
      .panel .snapshot-player__progress { color: #555; font-size: 12px; }
      @media (max-width: 560px) {
        .heading { padding: 14px; }
        .content { padding: 12px; }
        h3 { font-size: 19px; }
        .cells { gap: 6px; }
        .value { font-size: 27px; }
        .source { font-size: 11px; letter-spacing: -.3px; }
        .panel .snapshot-player__button, .panel .snapshot-player__speed { min-height: 44px; }
      }
      @media print {
        .panel { border: 0; color: #000; break-inside: avoid; }
        .controls, .packet, .route { display: none; }
      }
    `
    const panel = document.createElement('section')
    panel.className = 'panel'
    panel.setAttribute('aria-label', '相邻位置累计贡献动画')
    panel.innerHTML = `
      <header class="heading">
        <h3>贡献累计 · 相邻传递</h3>
      </header>
      <div class="content">
        <div class="visual">
          <div class="stage">
            <div class="route" hidden aria-hidden="true"></div>
            <div class="packet" hidden aria-hidden="true"></div>
            <div class="cells"></div>
          </div>
          <p class="figure-caption">灰底：当前累计位置。</p>
        </div>
        <div class="controls"></div>
      </div>
    `
    context.root.append(style, panel)

    function find<T extends HTMLElement>(selector: string): T {
        return panel.querySelector<T>(selector)!
    }
    const cells = find('.cells')
    const stage = find('.stage')
    const packet = find('.packet')
    const route = find('.route')
    const cards = initial.map((_, i) => {
        const card = document.createElement('div')
        card.className = 'cell'
        card.innerHTML = `<div class="label">a<sub>${i + 1}</sub></div>
          <div class="value"></div><div class="source"></div>`
        cells.append(card)
        return card
    })

    const steps = buildSteps()
    let previousIndex = 0
    let flight: Animation | undefined
    let generation = 0

    function draw(index: number) {
        const step = steps[index]
        cards.forEach((card, i) => {
            card.classList.toggle('active', i === step.active)
            card.querySelector('.value')!.textContent = String(step.values[i])
            card.querySelector('.source')!.textContent = i <= step.active
                ? initial.slice(0, i + 1).join(' + ') : String(initial[i])
            card.setAttribute('aria-label', `位置 ${i + 1}，值 ${step.values[i]}${i === step.active ? '，当前累计位置' : ''}`)
        })
    }

    const player = createSnapshotPlayer({
        root: find('.controls'),
        steps,
        intervalMs: 2000,
        render(_step, { index }) {
            const currentGeneration = ++generation
            flight?.cancel()
            flight = undefined
            packet.hidden = route.hidden = true
            const forward = index === previousIndex + 1
            previousIndex = index

            if (!forward || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                draw(index)
                return
            }

            draw(index - 1)
            const amount = steps[index - 1].values[index - 1]
            const box = stage.getBoundingClientRect()
            const from = cards[index - 1].getBoundingClientRect()
            const to = cards[index].getBoundingClientRect()
            const start = from.left + from.width / 2 - box.left
            const end = to.left + to.width / 2 - box.left
            packet.textContent = `+${amount}`
            packet.hidden = route.hidden = false
            packet.style.left = `${start - packet.offsetWidth / 2}px`
            route.style.left = `${start}px`
            route.style.width = `${end - start}px`
            flight = packet.animate([
                { transform: 'translateX(0)', opacity: 1 },
                { transform: `translateX(${end - start}px)`, opacity: 1 },
            ], { duration: 420, easing: 'ease-in-out', fill: 'forwards' })
            flight.onfinish = () => {
                if (currentGeneration !== generation) return
                packet.hidden = route.hidden = true
                draw(index)
            }
        },
    })
    context.onCleanup(() => {
        ++generation
        flight?.cancel()
        player.destroy()
        panel.remove()
        style.remove()
    })
}
