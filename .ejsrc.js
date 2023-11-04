const {menu_html} = require("./src/menu.js")
// console.log(menu_html)
module.exports = 
    {
        menu : {
            // html:"<h1>hello</h1>"
            html:menu_html
        },
        "locals": {
            "foo": "bar"
        }
    }
