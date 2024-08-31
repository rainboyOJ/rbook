#!/usr/bin/env node

// rbook.js 是本题目库的命令行 使用[tj/commander  命令行参数解析库](https://github.com/tj/commander.js/blob/HEAD/Readme_zh-CN.md)
// usage:
// rbook db update 更新数据库
// rbook db find --id 查找数据库
// rbook render 渲染所有的md文件

const { Command } = require('commander');
const program = new Command();
const menujs = require("../src/menu.js")
const {execSync} = require("child_process")

const utils = require("../src/lib/utils.js")

const rbookDB = require("../src/lib/database/index.js")
const _problemDb = require("../problems/src/lib/database/index.js")
const problemDB =  new _problemDb();

const render_md = require("../bin/render_markdown.js")

program
  .name('rbook')
  .description('rbook电子书命令行管理工具')
  .version('0.0.1');

program.command('db')
  .description('数据库操作')
    //一个options的位置参数
  .argument('<command>', '命令: update,find')
  .option('--id <id>', '查找文章的id,默认为查找所有')
  .action((command, options) => {
        cmd = command.toLowerCase()
        if(cmd === 'update') {
            rbookDB.init();
            let d = menujs.flatten_menu_json
            rbookDB.insert_article(d)
            rbookDB.saveDb()
            console.log('更新数据库完成!')
        }
        else if (cmd === 'find') {
            let id = options.id
            rbookDB.loadDb()
            if( id ) {
                let cols = database.find_by_id(id)
                console.log(cols)
            }
            else {
                console.log('TODO')
            }
        }
        else {
            console.log('do not support this command : ' + cmd)
        }
  });

//渲染命令
program.command('render')
  .description('渲染md文件')
  .argument('[id]', '根据id渲染md,为空时从当前路径读取config得到id')
  .action((id, options) => {
        if( !id) {
            let info = utils.load_config(process.cwd())
            console.log('get_local_info : ',info)
            id = info.id
            if(!id) {
                throw('当前config文件里没有id属性!')
            }
        }

        rbookDB.loadDb();
        //从Db中查找包含当前路径或id为当前的值
        let doc = rbookDB.find_by_id(id)
        console.log('after search db by id: ',doc)
        if( !doc ) {
            throw('没有找到对应id的文章,你可能需要行更新数据库: npx rbook db update')
            return
        }
        problemDB.loadDatabase();
        
        render_md({
            ...doc,
            rbookDB,problemDB,
            debug:true
        })
    })

//渲染所有的文件
program.command('renderAll')
  .description('渲染所有的md文件')
  .action((id, options) => {

        console.log('注意之间先执行: npx rbook db update')
        problemDB.loadDatabase();
        rbookDB.loadDb();
        //从Db中查找包含当前路径或id为当前的值
        let docs = rbookDB.findAll()
        
        for(let doc of docs) {
            console.log(doc.md_file.relative_path,doc.title)
            render_md({
                ...doc,
                rbookDB,problemDB,
                debug:false
            })
        }
    })



//更新style css
program.command('style')
  .description('样式 css')
    //一个options的位置参数
  .action((command, options) => {
        execSync('npx sass ./src/markdown-style/markdown-r.scss ./dist/markdown.css')
   })

program.parse()
