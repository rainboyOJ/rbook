load_data.js 是一个vite的插件,它可以得到一些数据,并把这些数据传递给后续的js文件

它是如何实现的呢?


```js
module.exports = function nodejsPlugin() {
    return {
        name: 'nodejs-plugin',
        config() {
            // 在 Vite 构建过程中执行 Node.js 代码
            // const data = fs.readFileSync('yourNodeJsFile.js', 'utf-8');

            load_data();
            // console.log(Nodes)
            // console.log(Edges)
            return {
                define: {
                    // 将计算得到的数据传递给前端
                    // !!! 那么后面的app.js 也就是在index.html 引用的js文件
                    // 可以直接使用 Nodes 与 Edges
                    Nodes,Edges
                }
            };
        }
    };
}
```