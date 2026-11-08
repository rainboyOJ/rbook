const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

const { EDGES, NODES, buildFrames, easeInOut, isTreeEdge, lerp, runTarjan } = require(
    '../book/graph/tarjan/scc/scc-model.ts',
)

/**
 * 动画里画的每个数字都必须来自真实跑过的 Tarjan。
 * 这些断言同时是文章的「走一遍例子」那张表的机器可读版本：
 * 断言写死的是文章表格里的值，不是 runTarjan 自己算出来的值。
 */
describe('Tarjan SCC 演示模型', () => {
    const result = runTarjan()

    it('dfn 与文章表格一致（访问顺序 1、3、4、6、5、2）', () => {
        assert.deepEqual(result.dfn, { 1: 1, 3: 2, 4: 3, 6: 4, 5: 5, 2: 6 })
    })

    it('low 与文章表格一致', () => {
        assert.deepEqual(result.low, { 1: 1, 3: 1, 4: 1, 6: 4, 5: 5, 2: 3 })
    })

    it('分量按出栈顺序划分为 {6}、{5}、{1,2,3,4}', () => {
        assert.deepEqual(result.components, [[6], [5], [1, 2, 3, 4]])
        assert.deepEqual(result.roots, [6, 5, 1])
    })

    it('每个点恰好属于一个分量，编号与出栈顺序一致', () => {
        assert.deepEqual(result.color, { 1: 2, 2: 2, 3: 2, 4: 2, 5: 1, 6: 0 })
        assert.equal(new Set(result.components.flat()).size, NODES.length)
    })

    it('DFS 树边正好是文章插图画的那五条', () => {
        assert.deepEqual(result.treeEdges, [
            { from: 1, to: 3 },
            { from: 3, to: 4 },
            { from: 4, to: 6 },
            { from: 3, to: 5 },
            { from: 1, to: 2 },
        ])
    })

    it('非树边是 4->1、2->4、5->6，且三者都不是树边', () => {
        const nonTree = EDGES.filter(edge => !isTreeEdge(edge, result.treeEdges))
        assert.deepEqual(nonTree, [
            { from: 4, to: 1 },
            { from: 2, to: 4 },
            { from: 5, to: 6 },
        ])
    })

    it('同分量内两两互相可达，跨分量至少一个方向不通', () => {
        const reach = new Map()
        for (const node of NODES) reach.set(node.id, new Set([node.id]))
        for (let round = 0; round < NODES.length; round++) {
            for (const edge of EDGES) {
                const from = reach.get(edge.from)
                for (const target of reach.get(edge.to)) from.add(target)
            }
        }
        for (const u of NODES) {
            for (const v of NODES) {
                const mutual = reach.get(u.id).has(v.id) && reach.get(v.id).has(u.id)
                const sameComponent = result.color[u.id] === result.color[v.id]
                assert.equal(mutual, sameComponent, `${u.id} 与 ${v.id}`)
            }
        }
    })

    it('两套坐标下分量包围圆都互不相交、互不包含', () => {
        // 第三幕要给每个分量画一个包围圆。第一幕是图布局、第二幕起是树布局，
        // 两套坐标都得验：否则单点分量容易被大分量的大圆套住，画面读不出来。
        const RADIUS = 22
        const PAD = 30
        const layouts = {
            图布局: (node) => ({ x: node.x, y: node.y }),
            树布局: (node) => ({ x: node.tx, y: node.ty }),
        }
        for (const [name, pick] of Object.entries(layouts)) {
            const circles = result.components.map(component => {
                const points = component.map(id => pick(NODES.find(node => node.id === id)))
                const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length
                const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length
                const reach = Math.max(...points.map(p => Math.hypot(p.x - cx, p.y - cy)))
                return { cx, cy, r: reach + RADIUS + PAD }
            })
            for (let i = 0; i < circles.length; i++) {
                for (let j = i + 1; j < circles.length; j++) {
                    const a = circles[i]
                    const b = circles[j]
                    const distance = Math.hypot(a.cx - b.cx, a.cy - b.cy)
                    assert.ok(
                        distance > Math.max(a.r, b.r),
                        `${name}：分量 ${i + 1} 与 ${j + 1} 的包围圆相交，` +
                        `d=${distance.toFixed(1)} r=${a.r.toFixed(1)}/${b.r.toFixed(1)}`,
                    )
                }
            }
        }
    })

    it('两套布局的所有点都落在画布内，且位移不会让点跳出画布', () => {
        assert.equal(new Set(NODES.map(n => n.id)).size, NODES.length)
        const RADIUS = 22
        for (const node of NODES) {
            // 位移是线性插值，中间位置落在两端点之间，所以只需检查两端。
            for (const [x, y] of [[node.x, node.y], [node.tx, node.ty]]) {
                assert.ok(x - RADIUS > 0 && x + RADIUS < 560, `${node.id} x=${x}`)
                assert.ok(y - RADIUS > 0 && y + RADIUS < 470, `${node.id} y=${y}`)
            }
        }
    })

    it('位移插值：两端精确命中目标布局，中间单调且不越界', () => {
        assert.equal(easeInOut(0), 0)
        assert.equal(easeInOut(1), 1)
        let previous = -1
        for (let t = 0; t <= 1.0001; t += 0.05) {
            const eased = easeInOut(Math.min(t, 1))
            assert.ok(eased >= previous - 1e-9, `t=${t} 处不单调`)
            assert.ok(eased >= 0 && eased <= 1, `t=${t} 处越界 eased=${eased}`)
            previous = eased
        }
        const node = NODES[0]
        assert.deepEqual(
            [lerp(node.x, node.tx, 0), lerp(node.y, node.ty, 0)],
            [node.x, node.y],
        )
        assert.deepEqual(
            [lerp(node.x, node.tx, 1), lerp(node.y, node.ty, 1)],
            [node.tx, node.ty],
        )
    })

    it('第一幕的图布局是参考图的网格：1/3 上排、2/4 下排、5/6 右侧', () => {
        const at = id => NODES.find(n => n.id === id)
        assert.equal(at(1).y, at(3).y, '1 与 3 同一排')
        assert.equal(at(2).y, at(4).y, '2 与 4 同一排')
        assert.ok(at(1).x < at(3).x, '1 在 3 左边')
        assert.ok(at(2).x < at(4).x, '2 在 4 左边')
        assert.ok(at(5).x > at(3).x && at(6).x > at(4).x, '5、6 在最右')
        assert.ok(at(5).y < at(6).y, '5 在 6 上方')
    })

    it('每条边的端点都是已声明的节点', () => {
        const ids = new Set(NODES.map(n => n.id))
        for (const edge of EDGES) {
            assert.ok(ids.has(edge.from), `未声明的起点 ${edge.from}`)
            assert.ok(ids.has(edge.to), `未声明的终点 ${edge.to}`)
        }
    })

    it('帧序列共六帧：原图 → DFS 树 → 标 dfn → 三个分量', () => {
        const frames = buildFrames(result)
        assert.equal(frames.length, 6)
        assert.deepEqual(
            frames.map(f => [f.treeLayout, f.showDfn, f.revealed]),
            [
                [false, false, 0],  // 原始图
                [true, false, 0],   // DFS 树
                [true, true, 0],    // 标出 dfn
                [true, true, 1],    // 分量①
                [true, true, 2],    // 分量②
                [true, true, 3],    // 分量③
            ],
        )
    })

    it('只有第 1 帧不是树布局，dfn 从第 3 帧起一直显示', () => {
        const frames = buildFrames(result)
        assert.equal(frames.filter(f => !f.treeLayout).length, 1)
        assert.equal(frames[0].treeLayout, false)
        for (const frame of frames.slice(2)) {
            assert.equal(frame.showDfn, true, frame.title)
        }
    })

    it('每帧的标题与分量内容一致，分量按出栈顺序揭晓', () => {
        const frames = buildFrames(result)
        assert.equal(frames[0].title, '第 1 幕 · 原始有向图')
        assert.equal(frames[1].title, '第 2 幕 · 变成 DFS 树')
        assert.equal(frames[2].title, '第 3 幕 · 标出 dfn')
        for (let i = 1; i <= 3; i++) {
            const frame = frames[2 + i]
            assert.equal(frame.title, `第 4 幕 · 第 ${i} 个出栈的分量`)
            // 说明里点的集合必须正是该分量的点（按出栈顺序）。
            assert.ok(
                frame.message.includes(`{${result.components[i - 1].join(',')}}`),
                frame.message,
            )
        }
    })

    it('dfn 小字标注的值就是真实 dfn（画面上会逐个读出）', () => {
        // 动画用 result.dfn[id] 直接渲染，这里固定住它，防止模型改动后画面悄悄变错。
        assert.deepEqual(
            NODES.map(n => result.dfn[n.id]).sort((a, b) => a - b),
            [1, 2, 3, 4, 5, 6],
            'dfn 应恰好是 1..6 的一个排列',
        )
        for (const node of NODES) {
            assert.ok(Number.isInteger(result.dfn[node.id]), `点 ${node.id}`)
        }
    })
})
