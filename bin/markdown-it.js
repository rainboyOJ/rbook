const MK = require("./markdown-it-pseudocodejs/")
const MDRender = require("markdown-r")
const double_square_bracket = require("./double-square-brackets/index.js")
MDRender.md.use(double_square_bracket)
MDRender.md.use(MK,{
    lineNumber:true
})



module.exports = MDRender
