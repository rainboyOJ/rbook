const Problem = require("/home/rainboy/mycode/RainboyOJ/problems/src/lib/online_judge/index.js")
const double_square_bracket_parse = function(state,silent) {
  // debugger;
  var start, marker, matchStart, matchEnd, token,
      pos = state.pos,
      max = state.posMax,
      ch = state.src.charCodeAt(pos);

  if (ch !== 0x5B/* [ */) { return false; }
  if ( pos+1 >= max || state.src.charCodeAt(pos+1) !== 0x5B  ) { return false;}

  start = pos;
  pos+=2;
  if( pos >= max )  return false;
  matchStart = pos;
  while (pos < max && state.src.charCodeAt(pos) !== 0x5D/* ] */) { pos++; }
  if( pos+1 >= max ||  state.src.charCodeAt(pos+1) !== 0x5D) { return false;}

  marker = state.src.slice(start, pos); //提取[[ 中间 ]]

  matchEnd = pos;

  if (!silent) {
    token         = state.push('double_square_bracket', 'span', 0);
    token.markup  = marker;
    token.content = state.src.slice(matchStart, matchEnd)
      .replace(/\n/g, ' ')
      .replace(/^ (.+) $/, '$1');
    // console.log(token)
  }
  state.pos = matchEnd+2;
  return true;

}

const double_square_bracket_render = function(tokens,idx) {
    let content = tokens[idx].content
    const reg = /^[p|P]:\ ?(\S+)\ ?$/

    //满足题目的要求
    if( reg.test(content) ) {
        let pid = reg.exec(content)[1]
        // console.log(pid)
        let info = Problem.get_info_by_problem_path(pid)
        // console.log(info)
        const problemUrl = `https://roj.ac.cn${info.link}`;
        return `<a href="${problemUrl}" target="_blank" class="problem-link">${info.oj} ${info.sid} ${info.title}</a>`;
    }

    return `<span>${content}</span>`

}

//参数md实例
function double_square_bracket(md) {
  md.inline.ruler.before('link','double_square_bracket',double_square_bracket_parse)
  md.renderer.rules['double_square_bracket'] = double_square_bracket_render
}

module.exports = double_square_bracket
