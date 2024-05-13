const lokidb = require("lokijs")
const {join} = require("path")
const fs = require("fs")
// const LokiFsAdapter = require('lokijs/src/loki-fs-adapter.js');
const LokiFsSyncAdapter = require('lokijs/src/loki-fs-sync-adapter.js');

// const {flatten_menu_to_json_array} = require("../../md_info.js")

function rbook_db () {
    this.db = new lokidb( join(__dirname,'rbook.db'),{
        adapter: new LokiFsSyncAdapter()
    })
    this.article_coll = 'articles'
    // this.article = this.db.addCollection()
}

//查找所有的数据
rbook_db.prototype.findAll = function() {
    return this.db.getCollection(this.article_coll).find({})
}

rbook_db.prototype.find_by_id = function(id) {
    return this.db.getCollection(this.article_coll).findOne({id})
}

rbook_db.prototype.query = function(query) {
    //TODO
}


rbook_db.prototype.list_cols =  function() {
    console.log(
        this.db.listCollections()
    )
}

rbook_db.prototype.init = function(){
    if(! this.db.getCollection(this.article_coll)) {
        this.db.addCollection(this.article_coll)
    }
}

rbook_db.prototype.insert_article  = function(article){
    // if(! this.db.getCollection()) {
    //     this.init();
    // }
    this.db.getCollection(this.article_coll).insert(article)
}

rbook_db.prototype.saveDb = function () {
    this.db.saveDatabase(function(err){
        if( err)
            console.log(err)
    })
}

rbook_db.prototype.loadDb = function () {
    this.db.loadDatabase()
}

//与上面执行同样的函数
rbook_db.prototype.loadDatabase = function () {
    this.db.loadDatabase()
}

// rbook_db.prototype.init_by_flatten_menu = function() {
//     this.init();
//     // console.log(flatten_menu_to_json_array.length)
//     let {flatten_menu_json}= require("../../menu.js")
//     this.insert_article(flatten_menu_json)
//     this.save();
// }

module.exports = new rbook_db()
