//作用: 
// 从menu中读取数据,然后转换每一个markdown 文件为html

const {get_ejs_template,cwd}  = require("../src/lib/utils.js")
const {mkdirp} = require("mkdirp")
const P = require("path")
const fs = require("fs")
const {flatten_menu} = require("../src/menu.js")
const MDRender = require("markdown-r")

const article = get_ejs_template("article.html")


for( let path of flatten_menu ) {
    console.log('render -> ',path)
    // TODO check file timestap to check if or not to render
    let real_path = P.join(cwd,path)
    let raw = fs.readFileSync(real_path,{encoding:'utf-8'})
    let ejs = {
        data: {

        },
        options: {
            filename:real_path
        }
    }
    let {header,content} = MDRender(raw,{ ejs })

    //渲染数据
    let html = article({header,content})
    // console.log(html)
    //写入
    let output_path = P.join(cwd,'dist',path).replace(/md$/,'html');
    console.log(output_path)
    mkdirp.sync(P.dirname(output_path));
    fs.writeFileSync(output_path,html,{encoding:'utf-8'})
}

