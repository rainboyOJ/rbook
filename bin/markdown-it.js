const MK = require("./markdown-it-pseudocodejs/")
const MDRender = require("markdown-r")


const triple_square_bracket = require("./triple-square-brackets/index.js")
const problem_list = require("./problem_list/problem_list.js")

MDRender.md.use(triple_square_bracket)

MDRender.md.use(problem_list)

MDRender.md.use(MK,{
    lineNumber:true
})

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
            return `<div class="oneWordAlgo">\n<div class="title"><span>一句话算法</span></div><div class="content">`;

        } else {
            // closing tag
            return '</div></div>\n';
        }
    }
})


MDRender.md.use(mdItContainer,'colorfulbox',{
    validate: function( params ){
        return ( /^colorfulbox$/i.test(params.trim()))
    },
    render: function(tokens, idx, _options, env, self){

        if (tokens[idx].nesting === 1) {
            // opening tag
            return `<div class="colorfulbox">\n`;

        } else {
            // closing tag
            return '</div>\n';
        }
    }
})

//对MDRender 进行配置 结束


module.exports = MDRender
