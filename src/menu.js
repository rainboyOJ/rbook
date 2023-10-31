const {join} = require("path")
const ejs = require("ejs")
const {get_ejs_template,srcp}  = require("./lib/utils.js")

const li_item = get_ejs_template("li_item.html")
//左侧的菜单
const menu = [
    {
        title: "搜索",
        path:"search",
        child:[
            {
                title:"深度优先搜索",
                path:"dfs",
                child:[
                    {
                        title:"序",
                        path:'index.md'
                    }
                ]
            }
        ]
    }
]

// 把menu数据转成 ul > li 数据
function menu_to_ul_list(parent_path,data) {
    let html = ''
    if ( Array.isArray(data) ) { //是数组
        html += '<ul>\n'
        for(let d of data ) {
            html += menu_to_ul_list(parent_path,d)
        }
        html += '</ul>\n'
    }
    else { // 不是数组,那就是一个item,转成li
        let ul = ''
        if( data.child)
            ul = menu_to_ul_list(join(parent_path,data.path),data.child)
        html = li_item({...data,ul})
    }
    return html;
}

const menu_html = menu_to_ul_list(srcp,menu)
// console.log(menu_html)

// 把menu数据flatten
// [path1,path2,path3,...]
function flatten_menu(parent_path,data) {
}
