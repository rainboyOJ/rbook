// A chapter includes its own connected articles and only their direct external neighbours.
export function chapterView(data, chapter, expanded = null) {
    const own = new Set(data.nodes.filter(n => n.chapter === chapter).map(n => n.id))
    const connected = new Set(data.edges.flatMap(e => [e.from, e.to]))
    const ids = new Set([...own].filter(id => connected.has(id)))
    for (const e of data.edges) if (own.has(e.from) || own.has(e.to)) { ids.add(e.from); ids.add(e.to) }
    if (expanded) for (const id of ancestors(data.edges, expanded)) ids.add(id)
    return { nodes: data.nodes.filter(n => ids.has(n.id)),
        edges: data.edges.filter(e => ids.has(e.from) && ids.has(e.to)),
        isolated: data.nodes.filter(n => own.has(n.id) && !connected.has(n.id)) }
}
export function ancestors(edges, id) {
    const found = new Set([id]), pending = [id]
    while (pending.length) {
        const target = pending.pop()
        for (const e of edges) if (e.to === target && !found.has(e.from)) { found.add(e.from); pending.push(e.from) }
    }
    return found
}
// Condense cycles first, so even erroneous prerequisite cycles cannot hang the layout.
export function layout(nodes, edges) {
    const out = new Map(nodes.map(n => [n.id, []]))
    for (const e of edges) if (out.has(e.from) && out.has(e.to)) out.get(e.from).push(e.to)
    let clock = 0
    const index = new Map(), low = new Map(), stack = [], active = new Set(), groups = []
    function visit(id) {
        index.set(id, clock); low.set(id, clock++); stack.push(id); active.add(id)
        for (const to of out.get(id)) {
            if (!index.has(to)) { visit(to); low.set(id, Math.min(low.get(id), low.get(to))) }
            else if (active.has(to)) low.set(id, Math.min(low.get(id), index.get(to)))
        }
        if (low.get(id) === index.get(id)) {
            const group = []; let x
            do { x = stack.pop(); active.delete(x); group.push(x) } while (x !== id)
            groups.push(group)
        }
    }
    for (const n of nodes) if (!index.has(n.id)) visit(n.id)
    const component = new Map(groups.flatMap((g,i) => g.map(id => [id,i])))
    const rank = groups.map(() => 0), indegree = groups.map(() => 0), links = groups.map(() => new Set())
    for (const e of edges) {
        const a = component.get(e.from), b = component.get(e.to)
        if (a !== b && !links[a].has(b)) { links[a].add(b); indegree[b]++ }
    }
    const queue = indegree.flatMap((d,i) => d === 0 ? [i] : [])
    for (let i=0;i<queue.length;i++) for (const b of links[queue[i]]) {
        rank[b] = Math.max(rank[b], rank[queue[i]]+1)
        if (--indegree[b] === 0) queue.push(b)
    }
    const columns = []
    for (const n of nodes) (columns[rank[component.get(n.id)]] ||= []).push(n)
    const positions = new Map()
    // Barycentric ordering reduces crossings while keeping results deterministic.
    for (let col=0;col<columns.length;col++) {
        const items = columns[col]
        const score = n => {
            const ys = edges.filter(e => e.to===n.id && positions.has(e.from)).map(e => positions.get(e.from).y)
            return ys.length ? ys.reduce((a,b)=>a+b,0)/ys.length : Infinity
        }
        items.sort((a,b)=>score(a)-score(b))
        items.forEach((n,i)=>positions.set(n.id,{x:40+col*300,y:52+i*142,width:220,height:104}))
    }
    return { positions, width:Math.max(600,columns.length*300), height:Math.max(450,...columns.map(c=>c.length*142+90)),
        cyclic: new Set(groups.filter(g=>g.length>1 || out.get(g[0]).includes(g[0])).flat()) }
}
