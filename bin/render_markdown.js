//作用: 
// 从menu中读取数据,然后转换每一个markdown 文件为html

const {get_ejs_template,cwd}  = require("../src/lib/utils.js")
const {mkdirp} = require("mkdirp")
const P = require("path")
const fs = require("fs")
const {flatten_menu} = require("../src/menu.js")
const MDRender = require("markdown-r")

const article = get_ejs_template("article.html")

function render_md( path) {
    let md_file = ''
    let output_path = ''
    let data = {}
    // 1. 是否以结尾
    if (P.basename(path).endsWith('.md'))
    {
        md_file = path
    }
    else if ( fs.statSync(path).isDirectory()) {
        let raw_json = fs.readFileSync( P.join(path,'config.json'),{encoding:'utf8'})
        data = JSON.parse(raw_json)
        md_file =  P.join(path,data.file);
    }
    else {
        throw 'illegal path: ' + path
    }

    output_path = P.join(cwd, 'dist', P.relative(cwd+'/book',md_file)).replace(/md$/, 'html');
    let raw = fs.readFileSync(md_file,{encoding:'utf-8'})
    let ejs = {
        data,
        options: {
            filename:md_file
        }
    }
    let {header,content} = MDRender(raw,{ ejs })

    //渲染数据
    let html = article({header : { ...header,...data},content})
    // console.log(html)
    //写入
    mkdirp.sync(P.dirname(output_path));
    fs.writeFileSync(output_path,html,{encoding:'utf-8'})
}


for( let path of flatten_menu ) {
    console.log('render -> ',path)
    // TODO check file timestap to check if or not to render
    let real_path = P.join(cwd,'book',path)
    render_md(real_path)
}

