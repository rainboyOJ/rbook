const {menu_html} = require("./src/menu.js")
// console.log(menu_html)
module.exports = 
    {
        menu : {
            // html:"<h1>hello</h1>"
            html:menu_html
            base_url:"https://rbook.roj.ac.cn",
            self_host:"https://rbook.roj.ac.cn"
        },
        "locals": {
            "foo": "bar"
        }
    }
