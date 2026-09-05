
一个纯静态的rbook,一切以简单为本,遵循KISS原则

在线地址: https://rbook.roj.ac.cn

使用的技术

- ejs
- markdown-it
- asymptote
- graphviz
- scss
- vite 打包

##  文件


```

.
├── bin                 可执行脚本,包括渲染markdown的脚本
├── src
├── venv
├── book                书的md源文件
├── dist
├── images
├── manimce             动画
├── third_part          其它内容 
├── template.md
├── algo_template
├── vite.config.js
├── yarn-error.log
└── yarn.lock
```


## markdown 语法


```
+p THIS_ID
```
从roj里找所有`solutions/*md`文件里含有`practice_rbook: THIS_ID`的problems列表


### 多语言 code tab

```

\`\`\`js [g1:JavaScript]
console.log("hello");
\`\`\`

\`\`\`py [g1:Python3]
print("hello")
\`\`\`

```

### markdownit container

```
::: fold

:::


居中
::: center

::: 


一行
::: online 

::: lb-box 轮播

::
```

伪代码 语法: https://github.com/tatetian/pseudocode.js

```
::: pseudocode
:::
```

### excalidraw 点击打开
excalidraw 导出图片时,选择,保留数据

`![](1.excalidraw.svg)` 这然的图片会被渲染成

```

  open in excalidraw
+--------------------+
|   image  
+--------------------+
```

点击后`open in  excalidraw`,可以在excalidraw 里打开,可以进行修改

## TODO

- 重构
  - using typescript ?
  - functional programinl
    - https://github.com/gcanti/fp-ts
  - 新的模板引擎 Nunjucks
  - markdown-it 封装
    - 不再使用markdown-r,而是自己完善markdown-it
    - 新的功能: https://github.com/antfu/markdown-it-github-alerts


## 参考

- http://css.doyoe.com 参考样式

## 感谢

- [dashroshanvisits-counter 🔢 Customizable SVG visits counter badge](https://github.com/dashroshan/visits-counter)

