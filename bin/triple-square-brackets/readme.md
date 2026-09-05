我想要写一个markdown-it的插件,它可以解析`[[p:luogu-1045]]`这种inline 数据,如何做?

我知道`markdown-it`有两种类型的结构

- block
- inline


那么inline是如何解析的呢?


根据:[markdown-it 原理解析 · Issue 252 · mqyqingfengBlog](https://github.com/mqyqingfeng/Blog/issues/252)这个文章来简单的回忆一下,markdown-it的源码

还有这里:https://juejin.cn/post/6844903638490415117



入口 `lib/index.js`

里有一个`var ParserInline = require('./parser_inline');`

再查看`parser_inline.js`文件

里面有两个`rule`:`_rules,_rules2`,分别把两个元素添加到`this.ruler,this.ruler2`两个ruler里

查看`link`这个规则是如何写的,因为`[[p:luogu-1045]]`很像是link规则
