const ejs = require("ejs")
const Path = require("path")
const fs = require("fs")
const raw_html_template = fs.readFileSync(Path.join(__dirname,"./html_title.html"),{encoding:"utf8"})
const Tooltip = ejs.compile(raw_html_template)

// 移除对仓库外 ../../problems 的硬依赖
const problemDB = null

function loadArticlesDatabase() {
    try {
        const { loadCatalog } = require('../../.tsbuild/publishing/content/catalog-loader.js')
        const { flattenCatalog } = require('../../.tsbuild/publishing/domain/catalog.js')
        const { resolveArticleSource } = require('../../.tsbuild/publishing/content/source-resolver.js')
        const { PathPolicy } = require('../../.tsbuild/publishing/content/path-policy.js')

        const projectRoot = Path.resolve(__dirname, '../../')
        const policy = new PathPolicy(projectRoot)
        const catalog = loadCatalog(Path.join(policy.book, 'catalog.yaml'), [])
        const leaves = flattenCatalog(catalog)
        const docs = leaves.map(leaf => {
            const resolved = resolveArticleSource(leaf, policy.book, [])
            return {
                ...resolved.metadata,
                id: resolved.metadata.id,
                title: resolved.metadata.title,
                href: policy.publishHref(resolved.source.filePath),
            }
        })
        const map = new Map(docs.map(d => [d.id, d]))
        return {
            findAll: () => docs,
            find_by_id: (id) => map.get(id),
        }
    }
    catch {
        const legacyDb = require('../../src/lib/database/index.js')
        legacyDb.loadDb()
        return legacyDb
    }
}

const rbookDB = loadArticlesDatabase()

//2.加载Nodes数据
var Nodes = []
var Edges = []
var set = new Set()
var edge_set = new Set()

function add_node(node) {
    if (!node) return
    let id = node.id || node._id
    if (!id) return
    if (set.has(id)) return
    set.add(id)

    let data = {
        ...node,
        id,
        label: node.label || node.title,
    }

    if (node.oj)
        data.group = 'problem'

    Nodes.push(data)
}

function get_node_by_id(id) {
    return rbookDB.find_by_id(id)
}

function add_edge(pre_id, to_id) {
    let edge_id = `${pre_id}-${to_id}`
    if (edge_set.has(edge_id)) return
    edge_set.add(edge_id)
    Edges.push({ from: pre_id, to: to_id })
}

function load_pre(node) {
    if (typeof(node.pre) === 'string') {
        const preNode = get_node_by_id(node.pre)
        if (preNode) {
            add_edge(node.pre, node.id)
            add_node(preNode)
        }
    }
    else if (Array.isArray(node.pre)) {
        for (let pre of node.pre) {
            const preNode = get_node_by_id(pre)
            if (preNode) {
                add_edge(pre, node.id)
                add_node(preNode)
            }
        }
    }
}

function recv_add_problem(father_id) {
    if (!problemDB) return
    let problems = problemDB.find_pre_has(father_id)
    if (!problems) return
    for (let p of problems) {
        if (set.has(p._id)) continue
        add_node(p)
        add_edge(father_id, p._id)
        recv_add_problem(p._id)
    }
}

function load_problem(d) {
    if (!problemDB) return
    let id = d.id
    let problems = problemDB.find_pre_rbook(id)
    if (!problems) return
    for (let p of problems) {
        add_node(p)
        add_edge(id, p._id)
        recv_add_problem(p._id)
    }
}

function load_data() {
    Nodes = []
    Edges = []
    set.clear()
    edge_set.clear()

    let all_docs = rbookDB.findAll()
    console.log("all_docs cnt", all_docs.length)
    for (let d of all_docs) {
        if (!d.id) continue
        if (d.hiden_brain_map) continue
        add_node(d)
        load_problem(d)
        if (d.pre) load_pre(d)
    }
}

module.exports = function nodejsPlugin() {
    return {
        name: 'nodejs-plugin',
        config() {
            load_data()
            return {
                define: {
                    Nodes,
                    Edges,
                }
            }
        }
    }
}
