'use strict';

var pseudocode = require('./pseudocode.js-1.1.0/pseudocode.min.js');

function pseudocode_block(state, start, end, silent){
    var firstLine, lastLine, next, lastPos, found = false, token,
        pos = state.bMarks[start] + state.tShift[start],
        max = state.eMarks[start]

    if(pos + 14 > max){ return false; }
    if(state.src.slice(pos,pos+14)!=='::: pseudocode'){ return false; }

    pos += 14;
    firstLine = state.src.slice(pos,max);

    if(silent){ return true; }
    if(firstLine.trim().slice(-3)===':::'){
        // Single line expression
        firstLine = firstLine.trim().slice(0, -3);
        found = true;
    }

    for(next = start; !found; ){

        next++;

        if(next >= end){ break; }

        pos = state.bMarks[next]+state.tShift[next];
        max = state.eMarks[next];

        if(pos < max && state.tShift[next] < state.blkIndent){
            // non-empty line with negative indent should stop the list:
            break;
        }

        if(state.src.slice(pos,max).trim().slice(-3)===':::'){
            lastPos = state.src.slice(0,max).lastIndexOf(':::');
            lastLine = state.src.slice(pos,lastPos);
            found = true;
        }

    }

    state.line = next + 1;

    token = state.push('pseudocode_block', 'pseudocode', 0);
    token.block = true;
    token.content = (firstLine && firstLine.trim() ? firstLine + '\n' : '')
    + state.getLines(start + 1, next, state.tShift[start], true)
    + (lastLine && lastLine.trim() ? lastLine : '');
    token.map = [ start, state.line ];
    token.markup = '::: pseudocode';
    return true;
}

module.exports = function pseudocode_plugin(md, options) {
    // Default options

    options = options || {};

    var pseudocodeBlock = function(code){
        try{
            return "<p>" + pseudocode.renderToString(code, options) + "</p>";
        }
        catch(error){
            if(options.throwOnError){ console.log(error); }
            return code;
        }
    }

    var blockRenderer = function(tokens, idx){
        return pseudocodeBlock(tokens[idx].content) + '\n';
    }

    md.block.ruler.after('blockquote', 'pseudocode_block', pseudocode_block, {
        alt: [ 'paragraph', 'reference', 'blockquote', 'list' ]
    });
    md.renderer.rules.pseudocode_block = blockRenderer;
};