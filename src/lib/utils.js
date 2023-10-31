const {join} = require("path")
const fs = require("fs")
const ejs = require('ejs')

const cwd = join(__dirname,'../../')
const srcp = join(cwd,'src')
const ejsp = join(srcp,'ejs')

function get_ejs_template(name) {
    let raw = fs.readFileSync(join(ejsp,name),{encoding:'UTF8'})
    return ejs.compile(raw,{client:true})
}

module.exports = {
    cwd,srcp,ejsp,
    get_ejs_template
}
