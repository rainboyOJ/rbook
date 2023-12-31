//作用: 
// 从menu中读取数据,然后转换每一个markdown 文件为html

const {get_ejs_template,cwd}  = require("../src/lib/utils.js")
const {mkdirp} = require("mkdirp")
const P = require("path")
const fs = require("fs")
const {flatten_menu} = require("../src/menu.js")
const MDRender = require("markdown-r")

const article = get_ejs_template("article.html")


//为md文件创建一个类,来得到它的各种信息
class md_file{
    constructor(md_file_path) {
        this._md_file_path = md_file_path
    }

    //绝对路径
    get file_path() {
        return this._md_file_path;
    }

    get file_dir() {
        return P.dirname(this.file_path);
    }

    //对应的 href link
    get href() {
        let href = P.relative(cwd+'/book',this.file_path).replace(/md$/, 'html');
        return href;
    let raw = fs.readFileSync(md_file,{encoding:'utf-8'})

    }

    //输出的绝对路径
    get output_path() {
        return P.join(cwd, 'dist',this.href)
    }

    get output_dir() {
        return P.dirname(this.output_path)
    }

    //文件的原始内容
    get raw() {
        return fs.readFileSync(this.file_path,{encoding:'utf-8'})
    }

    //这个md文件的github 路径
    get git_location() {
        return `https://github.com/`
    }

    mkdirp_output_path() {
        mkdirp.sync(this.output_dir);
    }

}

//处理md_file产生成data
// data.copy
function deal_md_file_data(md_file_obj,data) {

    // let md_file_obj = new md_file(md_file_path)
    if( data.copy ) {
        // md_file_obj.mkdirp_output_path();
        for( let copy_file of data.copy) {
            fs.copyFileSync(
                P.resolve(md_file_obj.file_dir,copy_file),
                P.resolve(md_file_obj.output_dir,copy_file)
                )
        }
    }
}

function render_md( path) {
    let md_file_path = ''
    let data = {}
    // 1. 是否以结尾
    if (P.basename(path).endsWith('.md'))
    {
        md_file_path = path
    }
    else if ( fs.statSync(path).isDirectory()) {
        let raw_json = fs.readFileSync( P.join(path,'config.json'),{encoding:'utf8'})
        data = JSON.parse(raw_json)
        md_file_path =  P.join(path,data.file);
    }
    else {
        throw 'illegal path: ' + path
    }

    let md_file_obj = new md_file(md_file_path)
    let href = md_file_obj.href
    let output_path = md_file_obj.output_path
    let raw = md_file_obj.raw

    // github上的地址
    data["href"] = href
    data["git_location"] = md_file_obj.git_location

    let ejs = {
        data,
        options: {
            filename:md_file_obj.file_path
        }
    }
    
    let {header,content} = MDRender(raw,{ ejs })

    if (!data.title) {
        data.title =  header.title || '未知'
    }

    //渲染数据
    let html = article({header,content,...data})
    // console.log(html)
    
    md_file_obj.mkdirp_output_path();
    fs.writeFileSync(output_path,html,{encoding:'utf-8'})

    //处理相应md_file的数据,例如copy
    deal_md_file_data(md_file_obj,data)
}


for( let path of flatten_menu ) {
    // TODO check file timestap to check if or not to render
    let real_path = P.join(cwd,'book',path)
    console.log('render -> ',real_path)
    render_md(real_path)
}

