const MD = require("./markdown-it.js")

let src = 'hello [[p:roj/1000]] work'

let out = MD.render(src)

console.log(out)
