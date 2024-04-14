



//1. 加载数据menu
const {flatten_menu_json} = require("../../src/menu.js")


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

function add_node(node) {
    if(!node.id) {
        console.error(`${node} does not have id attr!`)
        throw `${node} does not have id attr!`
    }
    if(set.has(node.id)) return
    set.add(node.id)
    Nodes.push({
        id: node.id,
        title: node.title,
        label: node.label || node.title,
        ...node
    })
}

function get_node_by_id(id) {
    for(let d of flatten_menu_json) {
        if( d.id == id)
            return d;
    }
    throw `not find node by id : ${id}`
}

function load_data(){

    for( let d of flatten_menu_json)
    {
        // 没有id,说明这个节点,没有加入
        if( ! d.id) continue;
        if( d.pre) {
            for( let pre of d.pre) {
                // console.log(pre, d.title)
                Edges.push({
                    from: pre,
                    to:d.id
                })
                add_node(get_node_by_id(pre))
            }
        }

        add_node(d)

        if (d.next) {
            for( let nxt of d.next) {
                // TODO
                // add_node(get_node_by_id(nxt))
                add_node(nxt)
                Edges.push({
                    from:d.id,
                    to:nxt.id
                })
            }
        }
    }
    // return {Nodes,Edges}
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
