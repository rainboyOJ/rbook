//作用: 
// 从menu中读取数据,然后转换每一个markdown 文件为html

const {get_ejs_template,cwd}  = require("../src/lib/utils.js")
const {mkdirp} = require("mkdirp")
const P = require("path")
const fs = require("fs")
const {flatten_menu} = require("../src/menu.js")
const MDRender = require("markdown-r")
const locals = require("./ejsrc.js").locals


const article = get_ejs_template("article.html")

const CWD = P.resolve(__dirname,"..")

//对MDRender 进行配置
//添加oneWordAlgo
const mdItContainer = require("markdown-it-container")
MDRender.md.use(mdItContainer,'oneWordAlgo',{
    validate: function( params ){
        return ( /^onewordalgo$/i.test(params.trim()))
    },
    render: function(tokens, idx, _options, env, self){

        if (tokens[idx].nesting === 1) {
            // opening tag
            return `<div class="oneWordAlgo">\n<div class="title"><h3>一句话算法:</h3></div><div class="one-content">`;

        } else {
            // closing tag
            return '</div></div>\n';
        }
    }
})
//对MDRender 进行配置 结束


//为md文件创建一个类,来得到它的各种信息
class md_file{
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

//处理md_file产生成data
// data.copy
function deal_md_file_data(md_file_obj,data) {

    // let md_file_obj = new md_file(md_file_path)
    if( data.copy ) {
        // md_file_obj.mkdirp_output_path();
        for( let copy_file of data.copy) {
            let src = P.resolve(md_file_obj.file_dir,copy_file)
            let to = P.resolve(md_file_obj.output_dir,copy_file)
            if( !fs.existsSync( P.dirname(to)) ){
                //mkdirp
                mkdirp.sync( P.dirname(to) );
            }
            fs.copyFileSync( src,to )
        }
    }
}

function render_md( path) {
    let md_file_path = ''
    let data = { ...locals }
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
    let output_path = md_file_obj.output_path
    let raw = md_file_obj.raw

    // github上的地址
    data["md_file"] = md_file_obj.to_object()
    let ejs = {
        data : {
            ...locals,
            ...data,
            //我内置的函数
            pid_to_url: function (oj_name,id,title)
            {
                function to_markdown_url(title,url) {
                    return `<a href="${url}" target="_blank">${title}</a>`
                }
                const roj_base_url = "https://roj.ac.cn/"
                title = `${oj_name} ${id} : ${title}`
                return to_markdown_url(title,roj_base_url + oj_name + '/' + id)
            },
            video: function (src) {
                if( src.indexOf('.mp4') == -1) src+='.mp4'
                return `<video width="800" loop controls autoplay src="/video/${src}" type="video/mp4">Your browser does not support the video tag. </video>`
            }
        },
        options: {
            filename:md_file_obj.file_path,
            root:CWD
        }
    }
    // console.log(data)
    
    let {header,content} = MDRender.render(raw,{ ejs })

    if (!data.title) {
        data.title =  header.title || '未知'
    }
    
    if(data['teach_plan']) {
        let teach_plan_path = P.join(md_file_obj.file_dir,data['teach_plan']);
        let teach_plan_obj = new md_file(teach_plan_path)
        // console.log(data['teach_plan'])
        data['teach_plan_href'] = teach_plan_obj.href
        //render it
        let teach_plan_data = {
            title:'教学计划',// TODO,
            teach_plan_href: null,
            md_file: teach_plan_obj.to_object()
        }
        let raw = teach_plan_obj.raw
        let {header,content} = MDRender.render(raw,{ ejs })
        let html = article({header,content,...teach_plan_data})

        teach_plan_obj.mkdirp_output_path();
        fs.writeFileSync(teach_plan_obj.output_path,html,{encoding:'utf-8'})
    }
    else
        data['teach_plan_href'] = null

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

