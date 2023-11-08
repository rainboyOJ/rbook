const {join} = require("path")
const ejs = require("ejs")
const {get_ejs_template,srcp}  = require("./lib/utils.js")

const li_item = get_ejs_template("li_item.html")
//左侧的菜单
const menu = [
    {
        title:'前言',
        path:"introducation/index.md",
    },
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
    },
    {
        title:"附录",
        path:"appendix",
        child: [
            {
                title:"python",
                path:"python.md"
            },
            {
                title:"编程常用单词",
                path:"编程常用单词.md"
            },
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
        let cp = join(parent_path,data.path)
        if( data.child)
            ul = menu_to_ul_list(cp,data.child)
        html = li_item({...data,ul,link:cp})
    }
    return html;
}

exports.menu_html = menu_to_ul_list('/',menu)
// console.log(menu_html)

// 把menu数据flatten
// [path1,path2,path3,...]
function _flatten_menu(parent_path,resolve,data) {
    let arr = []

    if ( Array.isArray(data) ) { //是数组
        for(let d of data ) {
            arr = arr.concat( _flatten_menu(parent_path,resolve,d) )
        }
    }
    else { // 不是数组,那就是一个item,转成li
        let path = join(parent_path,data.path)
        let resolve_path = join(resolve,data.path)
        if( data.child)
            arr = arr.concat(_flatten_menu(path,resolve_path,data.child))
        else
            arr.push(resolve_path)
    }
    return arr;
}

// [ resolve-path1,...]
exports.flatten_menu = _flatten_menu(srcp,'',menu)

