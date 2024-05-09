/*
 * 作用: 从roj的题目库里提取含有某一标记的题目,得到一个题目列表
 * 语法
 * <空行>
 * +p <rbook_id> or THIS_ID "title"
 * 如果是THIS_ID,那么就得到当然的这个md 文件的id
 * <空行>
 * */
'use strict';
const ejs = require("ejs")
const {join} = require("path")
const {readFileSync} = require("fs")
const template = ejs.compile(readFileSync(join(__dirname,"./problem_list.html"),{encoding:"utf-8"}))

const problem_list_parse = function(state, startLine, endLine, silent) {
    // debugger
    let token,content
    let nextLine = startLine+1
    content = state.getLines(startLine, nextLine, state.blkIndent, false).trim();
    const p_list_reg = /\+p\s+.+/i
    if( !p_list_reg.test(content) )
    {
        return false
    }
    token = state.push('problem_list_open','div',1)
    token.attrs = [ ['class','problem_list_content'] ]

    token = state.push('problem_list_item','span',0)
    token.meta = content.replace(/^\+p\s*/i,'').split(' ')

    token = state.push('problem_list_close','div',-1)
    state.line = state.skipEmptyLines(startLine+1)
    return true


    /*
  //一行一行的扫描
  let first_flag = 1;
  let problem_list_args = []
  for( ;startLine < endLine ;startLine++)
  {
    if( state.isEmpty(startLine)) {
      token.meta = problem_list_args
      break;
    }
    content = state.getLines(startLine,startLine+1,state.blkIndent,false).trim();
    if( p_list_reg.test(content)) {
      if( first_flag ) {
        first_flag = 0;
      }
      else {
        //上一个 problem_list_item 结束了
        token.meta = problem_list_args
        problem_list_args = []
      }
      token = state.push('problem_list_item','span',0)
      problem_list_args = [content]
    }
    else {
      problem_list_args.push(content)
    }
  }

  token = state.push('problem_list_close','div',-1)
  state.line = state.skipEmptyLines(startLine)
  return true

    */
}

const problem_list_item_render = function(tokens,idx,options,env,slf) {
    const args = tokens[idx].meta
    // return args
    let id = args[0]
    if( id == 'THIS_ID') {
        id = env.id
    }
    if(!id) throw `${env.md_file.relative_path} has no id!`

    let problems = env.db.solutions_bidir_find('rbook',id) 
    let html = template({problems,id})
    // console.log(html)
    return html
}

//参数md实例
function problem_list(md) {
    md.block.ruler.before('list','problem_list',problem_list_parse,{ alt: []})
    md.renderer.rules['problem_list_item'] = problem_list_item_render
}

module.exports = problem_list
