形成
https://typst.app/universe/

类似这个的网站,然后点击复制

使用的css

```
#result {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(3,1fr);
    list-style: none;
    margin: 0;
    padding: 0;
}
```

应该需要使用:https://www.fusejs.io/ 这个基于js的fuzzy search library


然后:在 每个config里添加 {
"code_template" : [{
  title: "01背包,01 knapsnap",
  tags:[
    'dp'
  ],
  keyworkds: ['knapsnap'],
  //代码所在的路径
  code:' '

}]

}




## 构建

`public/` 是**构建产物**，不入库（见仓库根 `.gitignore`）。它由 `load_data.js`
（vite 插件）在构建时生成：

- 每篇带 `rbook.code_template` 的文章，源码从 `book/<路径>/…` 复制到
  `public/<同样相对路径>/…`
- 汇总成 `public/template.zip`

生成命令：

```
bash third_part/code_template_filter/build.sh
# 或仓库根执行 bash third_part/build.sh（会连带编译 brain_net_map 等）
```

唯一入库的文件是 `public/vite.svg`（favicon 源文件），`.gitignore` 里单独放行。
**不要**把 `public/` 下的其他文件提交回去——它们每次构建都会重新生成，
提交了只会在下次构建后变成一堆无意义的 diff。
