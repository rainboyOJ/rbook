const rbook_db = require("./index.js")
rbook_db.loadDbSync()
let a  = rbook_db.find_by_id('subset_enum')
console.log(a)
