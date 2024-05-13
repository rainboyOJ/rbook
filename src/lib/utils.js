const {join} = require("path")
const fs = require("fs")
const ejs = require('ejs')


const cwd = join(__dirname,'../../')
const srcp = join(cwd,'src')
const ejsp = join(srcp,'ejs')


const { parse:jsonc_parse } = require('jsonc-parser');
const jsyaml = require("js-yaml")


function get_ejs_template(name) {
    let filename = join(ejsp,name)
    let raw = fs.readFileSync(filename,{encoding:'UTF8'})
    return ejs.compile(raw,{filename})
}

function load_config(path) {
    let json_path = join(path,'config.json')
    let yaml_path = join(path,'config.yaml')
    let data
    if( fs.existsSync(json_path)) {
        let raw_json = fs.readFileSync(json_path,{encoding:'utf8'})
        // data = JSON.parse(raw_json)
        data = jsonc_parse(raw_json)
    }
    else if( fs.existsSync(yaml_path)) {
        let raw_yaml = fs.readFileSync( yaml_path,{encoding:'utf8'})
        // data = JSON.parse(raw_json)
        data =  jsyaml.load(raw_yaml)
    }
    else {
        throw 'can not found config file!'
    }
    return data
}

module.exports = {
    cwd,srcp,ejsp,
    get_ejs_template,
    load_config
}
