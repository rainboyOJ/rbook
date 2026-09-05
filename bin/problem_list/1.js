var {md,render} = require("../markdown-it.js")
md.use( require("./problem_list.js"))

let src = `
hello world

+p p1 p2 p3

+p pp1 pp2 pp3

+p  ppp1 ppp2 ppp3


hello world
hello world
`
//console tokens
// let tokens = md.parse(src,{})
// console.log(tokens)

let a = render(src)
console.log( a )
