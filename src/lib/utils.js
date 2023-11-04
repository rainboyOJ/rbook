const {join} = require("path")
const fs = require("fs")
const ejs = require('ejs')

const cwd = join(__dirname,'../../')
const srcp = join(cwd,'src')
const ejsp = join(srcp,'ejs')

function get_ejs_template(name) {
    let filename = join(ejsp,name)
    let raw = fs.readFileSync(filename,{encoding:'UTF8'})
    return ejs.compile(raw,{filename})
}

module.exports = {
    cwd,srcp,ejsp,
    get_ejs_template
}
