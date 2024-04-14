var ejs = require("ejs")


ejs.renderFile('./index.md',{},  {}, (err, str) => {
  if (err) {
    console.error(err);
  } else {
    console.log(str);
  }
});
