
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


## 参考

- http://css.doyoe.com 参考样式

## 感谢

- [dashroshanvisits-counter 🔢 Customizable SVG visits counter badge](https://github.com/dashroshan/visits-counter)

