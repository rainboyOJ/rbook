var md = require("../index")()
md.use( require("./double_square_bracket.js"))

let src = "hello [[p:luogu-p1024]] workd"
//console tokens
let tokens = md.parse(src,{})
console.log(tokens)

let a = md.render(src)
console.log( a )
