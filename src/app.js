// document.querySelectorAll('.sidebar a').addEventListener('click', function() {
//   // 在这里编写点击事件的处理代码
//     event.preventDefault();
//     console.log("hello world")
// });

console.log("h----------")
document.querySelectorAll('.sidebar a').forEach( function(link){

    link.addEventListener('click', function(event) {
        // 在这里编写点击事件的处理代码
        event.preventDefault();
        let href = link.getAttribute('href');
        console.log(href)
    });
})

