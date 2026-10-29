/**
 * Walker tidy tree, with Buchheim's contour threads and deferred shifts.
 * First walk: center parents, apportion overlapping sibling subtrees.
 * Second walk: accumulate modifiers to obtain final coordinates.
 * Layout uses input child order, independently of heavy-first DFS numbering.
 */
export interface TreePoint { x: number; y: number }

interface LayoutNode {
    id: number
    parent?: LayoutNode
    children: LayoutNode[]
    index: number
    prelim: number
    mod: number
    shift: number
    change: number
    thread?: LayoutNode
    ancestor?: LayoutNode
}

export function tidyLayout(children: readonly (readonly number[])[], root: number): TreePoint[] {
    function create(id: number, index: number, parent?: LayoutNode): LayoutNode {
        const node: LayoutNode = { id, index, parent, children: [], prelim: 0, mod: 0, shift: 0, change: 0 }
        node.ancestor = node
        node.children = children[id].map((v, i) => create(v, i, node))
        return node
    }
    const leftSibling = (node: LayoutNode) => node.parent?.children[node.index - 1]
    const nextLeft = (node: LayoutNode) => node.children[0] ?? node.thread
    const nextRight = (node: LayoutNode) => node.children.at(-1) ?? node.thread
    const separation = (a: LayoutNode, b: LayoutNode) => a.parent === b.parent ? 1 : 1.2

    function moveSubtree(left: LayoutNode, right: LayoutNode, distance: number) {
        const share = distance / (right.index - left.index)
        left.change += share
        right.change -= share
        right.shift += distance
        right.prelim += distance
        right.mod += distance
    }

    function apportion(node: LayoutNode, defaultAncestor: LayoutNode): LayoutNode {
        const sibling = leftSibling(node)
        if (!sibling) return defaultAncestor
        let insideLeft = sibling, insideRight = node
        let outsideLeft = node.parent!.children[0], outsideRight = node
        let sumIL = insideLeft.mod, sumIR = insideRight.mod
        let sumOL = outsideLeft.mod, sumOR = outsideRight.mod
        while (nextRight(insideLeft) && nextLeft(insideRight)) {
            insideLeft = nextRight(insideLeft)!
            insideRight = nextLeft(insideRight)!
            outsideLeft = nextLeft(outsideLeft)!
            outsideRight = nextRight(outsideRight)!
            outsideRight.ancestor = node
            const overlap = insideLeft.prelim + sumIL - insideRight.prelim - sumIR + separation(insideLeft, insideRight)
            if (overlap > 0) {
                const candidate = insideLeft.ancestor ?? insideLeft
                const ancestor = candidate.parent === node.parent ? candidate : defaultAncestor
                moveSubtree(ancestor, node, overlap)
                sumIR += overlap
                sumOR += overlap
            }
            sumIL += insideLeft.mod
            sumIR += insideRight.mod
            sumOL += outsideLeft.mod
            sumOR += outsideRight.mod
        }
        if (nextRight(insideLeft) && !nextRight(outsideRight)) {
            outsideRight.thread = nextRight(insideLeft)
            outsideRight.mod += sumIL - sumOR
        }
        if (nextLeft(insideRight) && !nextLeft(outsideLeft)) {
            outsideLeft.thread = nextLeft(insideRight)
            outsideLeft.mod += sumIR - sumOL
            defaultAncestor = node
        }
        return defaultAncestor
    }

    function firstWalk(node: LayoutNode) {
        const sibling = leftSibling(node)
        if (!node.children.length) {
            node.prelim = sibling ? sibling.prelim + separation(node, sibling) : 0
            return
        }
        let ancestor = node.children[0]
        for (const child of node.children) {
            firstWalk(child)
            ancestor = apportion(child, ancestor)
        }
        let shift = 0, change = 0
        for (let i = node.children.length - 1; i >= 0; i--) {
            const child = node.children[i]
            child.prelim += shift
            child.mod += shift
            change += child.change
            shift += child.shift + change
        }
        const midpoint = (node.children[0].prelim + node.children.at(-1)!.prelim) / 2
        node.prelim = sibling ? sibling.prelim + separation(node, sibling) : midpoint
        node.mod = node.prelim - midpoint
    }

    const tree = create(root, 0)
    firstWalk(tree)
    const points: TreePoint[] = Array.from({ length: children.length }, () => ({ x: 0, y: 0 }))
    function secondWalk(node: LayoutNode, accumulated: number, depth: number) {
        points[node.id] = { x: node.prelim + accumulated, y: depth }
        for (const child of node.children) secondWalk(child, accumulated + node.mod, depth + 1)
    }
    secondWalk(tree, -tree.prelim, 0)
    return points
}
