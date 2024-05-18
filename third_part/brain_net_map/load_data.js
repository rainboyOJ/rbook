const ejs = require("ejs")
const Path = require("path")
const fs = require("fs")
const raw_html_template = fs.readFileSync(Path.join(__dirname,"./html_title.html"),{encoding:"utf8"})
const Tooltip = ejs.compile(raw_html_template)
const _problemDB = require("../../problems/src/lib/database/index.js")
const problemDB = new _problemDB()


//1. 加载数据menu
// const {flatten_menu_json} = require("../../src/menu.js")
const rbookDB = require("../../src/lib/database/index.js")

problemDB.loadDatabase();
rbookDB.loadDb();



//2.加载Nodes数据
//需要的数据有
//
// id, label(显示), title()
// group 分组
// href 这个文章的链接
// pre 每个点的前置节点
//
// 下一节点,通常是题目
// next :[
//
// ]
// 还有edge数据
// console.log(flatten_menu_json)
var Nodes = []
var Edges = []
var set = new Set()
var edge_set = new Set()

//生成html的title 用于显示
function gen_html_title(node) {
    // check node
    // if( !node.title ) {
    //     console.log(node)
    //     throw `${node} has no title`
    // }
    return Tooltip({data: node })
}

function add_node(node) {
    // console.log(node)
    let id = node.id || node._id
    if(!id) {
        console.error(`${node} does not have id attr!`)
        throw `${node} does not have id attr!`
    }
    if(set.has(id)) return
    set.add(id)

    let data = {
        ...node,
        id,
        label: node.label || node.title,
        // title: gen_html_title(node)
    }

    if( node.oj )
        data.group = 'problem'

    Nodes.push(data)
}

function get_node_by_id(id) {
    let d = rbookDB.find_by_id(id)
    if(!d) throw `not find node by id : ${id}`
    return d
}

function add_edge(pre_id,to_id) {
    let edge_id = `${pre_id}-${to_id}`
    if( edge_set.has(edge_id)) return
    edge_set.add(edge_id)
    Edges.push({ from: pre_id, to:to_id })
}

function load_pre(node) {
    for( let pre of node.pre) {
        add_edge(pre,node.id);
        add_node(get_node_by_id(pre))
    }
}

function load_next(pre_node) {
    add_node(pre_node)
    if(pre_node.pre) load_pre(pre_node)
    //含有next
    if( pre_node.next) {
        for( let nxt of pre_node.next ) {
            add_edge(pre_node.id,nxt.id);
            load_next(nxt)
        }
    }
}

function recv_add_problem(father_id) {
    let problems =  problemDB.find_pre_has(father_id)

    //为空
    if(!problems) return
    for(let p of problems) {
        if( set.has(p._id) ) continue
        // console.log(p)
        add_node(p);
        add_edge(father_id,p._id);
        //递归
        recv_add_problem(p._id);
    }
}

//加载文章对应的题目
function load_problem(d) {
    let id = d.id
    let problems = problemDB.find_pre_rbook(id)
    for( let p of problems) {
        add_node(p)
        add_edge(id,p._id)

        // 从这个p里递归的 添加
        recv_add_problem(p._id);
    }
}


function load_data(){
    let all_docs = rbookDB.findAll()
    // console.log("all_docs cnt",all_docs.length)
    for( let d of all_docs)
    {
        // 没有id,说明这个节点,没有加入
        if( ! d.id) continue;
        if( d.hiden_brain_map) continue;
        add_node(d) //添加这个节点
        load_problem(d)
        if(d.pre) load_pre(d)
        // if(d.next) load_next(d)
    }
}

// export const Ns = Nodes
// export const Es = Edges


module.exports = function nodejsPlugin() {
    return {
        name: 'nodejs-plugin',
        config() {
            // 在 Vite 构建过程中执行 Node.js 代码
            // const data = fs.readFileSync('yourNodeJsFile.js', 'utf-8');

            load_data();
            // console.log(Nodes)
            // console.log(Edges)
            return {
                define: {
                    // 将计算得到的数据传递给前端
                    // $yourData: JSON.stringify(data)
                    Nodes,Edges
                }
            };
        }
    };
}
