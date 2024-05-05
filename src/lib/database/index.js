const lokidb = require("lokijs")
const {join} = require("path")

function rbook_db () {
    this.db = new lokidb( join(__dirname,'rbook.db'))
    this.article_coll = 'articles'
    // this.article = this.db.addCollection()
}

rbook_db.prototype.find_by_id = function(id) {
    return this.db.getCollection(this.article_coll).find({id})
}

rbook_db.prototype.query = function(query) {
    //TODO
}


rbook_db.prototype.list_cols =  function() {
    console.log(
        this.db.listCollections()
    )
}


rbook_db.prototype.save = function() {
    this.db.saveDatabase()
}

rbook_db.prototype.init = function() {
    // this.db.saveDatabase()
    let ret = this.db.addCollection(this.article_coll)
    // console.log(ret)
    // console.log(this.db.getCollection(this.article_coll))
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
    return new Promise( ( res,rej) => {
        this.db.loadDatabase({},function(err){
            if( err ) 
                rej(err);
            else
                res();
        })
    })
}

module.exports = new rbook_db()
