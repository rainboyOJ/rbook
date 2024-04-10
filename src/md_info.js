
const {get_ejs_template,cwd}  = require("./lib/utils.js")
const {mkdirp} = require("mkdirp")
const P = require("path")
const fs = require("fs")
const { parse:jsonc_parse } = require('jsonc-parser');

//为md文件创建一个类,来得到它的各种信息
class md_file {
    constructor(md_file_path) {
        this._md_file_path = md_file_path
    }

    //绝对路径
    get file_path() {
        return this._md_file_path;
    }

    get relative_path() {
        return P.relative(cwd,this.file_path)
    }

    get file_dir() {
        return P.dirname(this.file_path);
    }

    //对应的 href link
    get href() {
        let href = P.relative(cwd+'/book',this.file_path).replace(/md$/, 'html');
        return '/'+href;
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
        return `https://github.com/rainboyOJ/rbook/tree/master/${this.relative_path}`
    }

    mkdirp_output_path() {
        mkdirp.sync(this.output_dir);
    }

    to_object() {
        // start with an empty object (see other alternatives below) 
        return {
            file_path: this.file_path,
            file_dir:this.file_dir,
            relative_path: this.relative_path,
            href:this.href,
            output_path:this.output_path,
            output_dir: this.output_dir,
            git_location: this.git_location,
        }
    }
}

function md_info(path) { 
    let md_file_path = ''
    let data = {}
    // 1. 是否以结尾
    if (P.basename(path).endsWith('.md'))
    {
        md_file_path = path
    }
    else if ( fs.statSync(path).isDirectory()) {
        let raw_json = fs.readFileSync( P.join(path,'config.json'),{encoding:'utf8'})
        // data = JSON.parse(raw_json)
        data = jsonc_parse(raw_json)
        md_file_path =  P.join(path,data.file);
    }
    else {
        throw 'illegal path: ' + path
    }

    let md_file_obj = new md_file(md_file_path)
    // let output_path = md_file_obj.output_path
    // let raw = md_file_obj.raw
    // github上的地址
    data["md_file"] = md_file_obj.to_object()
    return data
}

function flatten_menu_to_json_array(flatten_menu) {
    return flatten_menu.map(item => { return md_info(P.join(cwd,'book',item)) })
}

exports.md_file = md_file;
exports.flatten_menu_to_json_array = flatten_menu_to_json_array;