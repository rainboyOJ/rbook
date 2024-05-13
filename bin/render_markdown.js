//作用: 
// 从menu中读取数据,然后转换每一个markdown 文件为html

const {get_ejs_template,cwd}  = require("../src/lib/utils.js")
const {mkdirp} = require("mkdirp")
const P = require("path")
const fs = require("fs")
const { parse:jsonc_parse } = require('jsonc-parser');
const {flatten_menu,flatten_menu_json,md_file} = require("../src/menu.js")
const locals = require("./ejsrc.js").locals


const MDRender = require("./markdown-it.js")



const article = get_ejs_template("article.html")

const CWD = P.resolve(__dirname,"..")

//处理md_file产生成data
// data.copy
function deal_md_file_data(data) {
    let {file_dir,output_dir} = data["md_file"]

    if( data.copy ) {
        for( let copy_file of data.copy) {
            let src = P.resolve(file_dir,copy_file)
            let to = P.resolve(output_dir,copy_file)
            if( !fs.existsSync( P.dirname(to)) ){
                //mkdirp
                mkdirp.sync( P.dirname(to) );
            }
            fs.copyFileSync( src,to )
        }
    }
}

function render_md( data ) {
    let output_path = data["md_file"].output_path
    let raw = fs.readFileSync(data["md_file"].file_path,{encoding:'utf-8'})
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
            },
            dvideo: function (src) {
                if( src.indexOf('.mp4') == -1) src+='.mp4'
                return `<video width="800" loop controls autoplay src="https://d.roj.ac.cn/d/RainboyVideo/${src}" type="video/mp4">Your browser does not support the video tag. </video>`
            }
        },
        options: {
            filename: data["md_file"].file_path,
            root:CWD
        },
    }
    // console.log(data)
    
    let {header,content} = MDRender.render(raw,
    { ejs ,
        //传递给env
        mdit: {
            ...locals,
            ...data
        }
    })

    if (!data.title) {
        data.title =  header.title || '未知'
    }
    
    if(data['teach_plan']) {
        let teach_plan_path = P.join(data["md_file"].file_dir,data['teach_plan']);
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
        let html = article({header,content,data:teach_plan_data})

        teach_plan_obj.mkdirp_output_path();
        fs.writeFileSync(teach_plan_obj.output_path,html,{encoding:'utf-8'})
    }

    //渲染数据
    let html = article({header,content,data})
    // console.log(html)
    
    // md_file_obj.mkdirp_output_path();
    mkdirp.sync(data["md_file"].output_dir);
    fs.writeFileSync(output_path,html,{encoding:'utf-8'})


    //处理相应md_file的数据,例如copy
    deal_md_file_data(data)
}


// for( let path of flatten_menu ) {
//     // TODO check file timestap to check if or not to render
//     let real_path = P.join(cwd,'book',path)
//     console.log('render -> ',real_path)
//     render_md(real_path)
// }

/*
async function main() {

    //problemDB.loadDatabase();
    //console.log('problem数据库加载完毕')
    for(let d of flatten_menu_json)
    {
        try {
            // console.log(process.argv)
            if( process.argv[2] && d.title != process.argv[2] && process.argv[2] != d.id)
            continue;

            console.log(d.md_file.relative_path,d.title)
            render_md(d)
            // console.log(d.md_file.file_path,d.title)
        }
        catch(e) {
            console.log('--------ERROR-----------')
            console.error(d.md_file)
            console.error(e)
            throw e;
        }
    }
}
main()
*/
module.exports = render_md
