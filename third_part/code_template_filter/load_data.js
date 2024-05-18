const ejs = require("ejs")
const Path = require("path")
const fs = require("fs")
const fse = require("fs-extra")
//const raw_html_template = fs.readFileSync(Path.join(__dirname,"./html_title.html"),{encoding:"utf8"})
//const Tooltip = ejs.compile(raw_html_template)

const project_dir = Path.join(__dirname,'../../book')


//1. 加载数据menu
const {flatten_menu_json} = require("../../src/menu.js")

var template_array = []
//2. 加载所有的 template 描述的array

function load_data() {

    //根据信息处理code_template
    function deal_code_template(d,code_template) {
        // console.log(d)
        // console.log(code_template)
        let file_dir = d.md_file.file_dir
        // console.log(file_dir)
        let code_path =  Path.join(file_dir,code_template.code)
        let code_path_relative = Path.relative(project_dir,code_path)
        let target_path = Path.join(__dirname,'public',code_path_relative)
        // console.log(code_path_relative)
        fse.copySync(code_path,target_path)

        //复制代码到public 文件夹下
        let url = code_path_relative
        return {
            ...code_template,
            //代码的url
            code: url
        }
    }



    // 不行,因为filter 返回的一个浅拷贝
    // let have_code = flatten_menu_json.filter(d => d.code_template)
    for (let d of flatten_menu_json) {
        if( !d.code_template) continue;
        for(let code of d.code_template) {
            //info 表示原来的数据
            template_array.push({...deal_code_template(d,code), info:d})
        }
    }
}





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



/*
function load_data(){
    for( let d of flatten_menu_json)
    {
        // 没有id,说明这个节点,没有加入
        if( ! d.id) continue;
        add_node(d)
        if(d.pre) load_pre(d)
        if(d.next) load_next(d)
    }
}
*/

// export const Ns = Nodes
// export const Es = Edges


module.exports = function nodejsPlugin() {
    return {
        name: 'nodejs-plugin',
        config() {
            // 在 Vite 构建过程中执行 Node.js 代码
            // const data = fs.readFileSync('yourNodeJsFile.js', 'utf-8');

            load_data();
            // console.log(template_array)
            return {
                define: {
                    // 将计算得到的数据传递给前端
                    // $yourData: JSON.stringify(data)
                    template_array
                }
            };
        }
    };
}
