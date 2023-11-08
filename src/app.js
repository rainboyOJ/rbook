// document.querySelectorAll('.sidebar a').addEventListener('click', function() {
//   // 在这里编写点击事件的处理代码
//     event.preventDefault();
//     console.log("hello world")
// });

document.getElementById('menu-toggle').addEventListener("click", function(){
    document.getElementById('menu-toggle').classList.toggle("active");
    document.getElementById('sidebar').classList.toggle("active");
})

//console.log("h----------")
document.querySelectorAll('.sidebar a').forEach( function(link){

    link.addEventListener('click', function(event) {
        // 在这里编写点击事件的处理代码
        event.preventDefault();
        if(link.classList.contains('document')) {
            let href = link.getAttribute('href');
            // console.log(href)
            window.location.hash = href.replace(/\.md$/,'');
            
        }
        else {
        // 找到父亲li
            let parentNode = link.parentNode
            while(parentNode !=null){
                // console.log(parentNode.tagName)
                if( parentNode.tagName.toLowerCase() === 'li')
            {
                    console.log("toggle active")
                    parentNode.classList.toggle("active")
                    break;
                }
                parentNode = parentNode.parentNode
            }
        }
    });
})


// 监听hash change
window.addEventListener('hashchange',function(){
    document.getElementById('article').setAttribute('src',location.hash.slice(1) + '.html')
},false)// ? false
