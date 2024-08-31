
const ejs = require("ejs")
const fs = require("fs")
const path = require("path")
let tt = fs.readFileSync(path.join(__dirname,"./problem_link_info_solution.html"),{encoding:'utf8'})
console.log(tt)
const problem_link_if_solution = ejs.compile(tt)

// let a = problem_link_if_solution({})
