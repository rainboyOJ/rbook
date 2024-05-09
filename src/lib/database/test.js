const rbook_db = require("./index.js")

// 使用方式一 : 只进行存储的时候
// rbook_db.init();
// rbook_db.insert_article({id:'hello',title:'work'})
// rbook_db.save()
//
rbook_db.init_by_flatten_menu();

//load_Data

async function main() {
    await rbook_db.loadDb();
    let doc = rbook_db.find_by_id('hello')
    console.log(doc)
    rbook_db.list_cols()
}

// main()
