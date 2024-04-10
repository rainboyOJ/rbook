



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
function load_data(){

    let Nodes = []
    let Edges = []


    for( let d of flatten_menu_json)
    {
        // 没有id,说明这个节点,没有加入
        if( ! d.id) continue;
        if( d.pre) {
            Edges.push({
                from: d.pre,
                to:d.id
            })
        }

        Nodes.push({
            id: d.id,
            title: d.title,
            label: d.label || d.title,
            ...d
        })

        if (d.next) {
            for( let nxt of d.next) {
                Nodes.push({
                    title:nxt.title || nxt.id,
                    label: nxt.label || nxt.title || nxt.id,
                    ...nxt
                })

                Edges.push({
                    from:d.id,
                    to:nxt.id
                })
            }
        }
    }
    return {Nodes,Edges}
}

// export const Ns = Nodes
// export const Es = Edges


module.exports = function nodejsPlugin() {
    return {
        name: 'nodejs-plugin',
        config() {
            // 在 Vite 构建过程中执行 Node.js 代码
            // const data = fs.readFileSync('yourNodeJsFile.js', 'utf-8');

            let{Nodes,Edges} = load_data();
            console.log(Nodes)
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
