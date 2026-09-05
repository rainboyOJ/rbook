// const Problem = require("../../problems/src/lib/online_judge/index.js")
// const rbookDb = require("../../src/lib/database/index.js")

// const _problemDB = require("../../problems/src/lib/database/index.js")
// const problemDB = new _problemDB()

//加载数据库,这个是同步的
// rbookDb.loadDatabase();

// const Problem = require("/home/rainboy/mycode/RainboyOJ/problems/src/lib/online_judge/index.js")
const ejs = require("ejs")
const fs = require("fs")
const path = require("path")

const problem_link_if_solution = ejs.compile(fs.readFileSync(path.join(__dirname,"./problem_link_info_solution.html"),{encoding:'utf8'}))

const double_square_bracket_parse = function(state,silent) {
  // debugger;
  var start, marker, matchStart, matchEnd, token,
      pos = state.pos,
      max = state.posMax,
      ch = state.src.charCodeAt(pos);

  // 验证开头是否是 三个 [[[
  if (ch !== 0x5B/* [ */) { return false; }
  if ( pos+1 >= max || state.src.charCodeAt(pos+1) !== 0x5B  ) { return false;}
  if ( pos+2 >= max || state.src.charCodeAt(pos+2) !== 0x5B  ) { return false;}

  start = pos;
  pos+=3;
  if( pos >= max )  return false;
  matchStart = pos;

  // 验证结尾是否是 三个 ]]]
  while (pos < max && state.src.charCodeAt(pos) !== 0x5D/* ] */) { pos++; }
  if( pos+1 >= max ||  state.src.charCodeAt(pos+1) !== 0x5D) { return false;}
  if( pos+2 >= max ||  state.src.charCodeAt(pos+2) !== 0x5D) { return false;}

  // marker = state.src.slice(start, pos); //提取[[ 中间 ]]

  matchEnd = pos;

  if (!silent) {
    token         = state.push('double_square_bracket', 'span', 0);
    token.meta = state.src.slice(matchStart, matchEnd)
    // token.markup  = marker;
    // token.content = state.src.slice(matchStart, matchEnd)
    //   .replace(/\n/g, ' ')
    //   .replace(/^ (.+) $/, '$1');
    // console.log(token)
  }
  state.pos = matchEnd+3;
  return true;

}

const double_square_bracket_render = function(tokens,idx,options,env,slf) {
    let content = tokens[idx].meta
    // const problem_reg = /^[p|P]:\ ?(\S+)\ ?$/
    // const rbook_reg= /^[p|P]:\ ?(\S+)\ ?$/
    const colon_split_reg = /\s*(.+)\s*:\s*(.+)\s*/

    //满足题目的要求
    if( colon_split_reg.test(content) ) {
        let [,type,id] =  colon_split_reg.exec(content)
        // console.log( colon_split_reg.exec(content))
        // console.log(type,id)
        type = type.toLowerCase()
        if( type === 'rbook') 
        {
            let info = env.rbookDB.find_by_id(id)
            if( env.debug ) {
                console.log('triple-square-brackets',info)
            }
            return `<a class="extra-link" target="_blank" href="https://rbook.roj.ac.cn${info.md_file.href}">[<img src="https://rbook.roj.ac.cn/rbookIcon/favicon-32x32.png"/> Rbook: ${info.title}]</a>`
        }
        else if (type == 'p' || type === 'problem')
        {
            let info = env.problemDB.getProblemById(id)
            if( env.debug ) {
                console.log('problem_id',id)
                console.log('triple-square-brackets',info)
            }
            if( info ) //如果找到了
                return `<a class="extra-link" target="_blank" href="https://roj.ac.cn${info.link}">[<img src="https://roj.ac.cn/fav/favicon-32x32.png"/> ${info.oj} ${info.sid}: ${info.title}]</a>`
        }
        //是否有rainboy写的题目解析
        else if (type == 'pp' || type  == 'problem_info_solution')
        {
            let info = env.problemDB.getProblemById(id)
            if( env.debug ) {
                console.log('triple-square-brackets',info)
            }
            if( info ) //如果找到了
            {
                return problem_link_if_solution({info})
            }
        }
        // let pid = reg.exec(content)[1]
        // // console.log(pid)
        // let info = Problem.get_info_by_problem_path(pid)
        // // console.log(info)
        // const problemUrl = `https://roj.ac.cn${info.link}`;
        // return `<a href="${problemUrl}" target="_blank" class="problem-link">${info.oj} ${info.sid} ${info.title}</a>`;
        // else if( )
    }

    return `<span>${content}</span>`

}

//参数md实例
function double_square_bracket(md) {
  md.inline.ruler.before('link','double_square_bracket',double_square_bracket_parse)
  md.renderer.rules['double_square_bracket'] = double_square_bracket_render
}

module.exports = double_square_bracket
