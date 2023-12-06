---
title : vscode的使用
author: rainboy
update_time : 2023-04-27
---

# vscode的使用

怎么自动格式化

1. 首先在vscode中安装扩展C/C++，扩展程序将自动安装clang-format。
2. 打开首选项设置（ctrl + ,），搜索format ，勾选format on save 自动保存。
3. 打开首选项设置（ctrl + ,），搜索format ，勾选format on Type 。

怎么自动保存

1. 打开首选项设置（ctrl + ,），搜索`auto save` ，选`afterDelay`。



## 运行

`c++ runner` 可以只用单击就能运行c++代码,且可以对代码进行调试,很有用.

设置

怎么运行的时候自动读取目录的`in`数据文件

左下角打开齿轮图标(⚙️图) --> 设置 --> 输入`run code config` -->


1. `File Directory As Cwd` 选中,设cpp的路径为`g++`编译器运行的路径
2. 点击`Executor Map`,点击`在setting中编辑`,找到`"cpp": "cd $dir && g++ $fileName -o $fileNameWithoutExt && $dir$fileNameWithoutExt"`

修改为

```
"cpp": "cd $dir && g++ $fileName -o $fileNameWithoutExt && $dir$fileNameWithoutExt < in",
```
也就是在最后添加`<in`,这样可以保证运行的时候，直接读取in文件


## 调试单个文件

参考：[VS Code之C/C++程序的调试(Debug)功能简介](https://zhuanlan.zhihu.com/p/85273055)

点击左侧的调试按钮

选LLVM/GDB



怎么保证的每次调试的时候，自动读取`in`数据文件呢

修改`launch.json`的`args`参数为

```
"args": [ "<", "in" ],
```

不想每次手动在main函数下断点，希望可以自动在main停止？

在 launch.json 文件中添加 stopAtEntry 字段，并将其设置为 true。这将在程序开始时立即停止在 main 函数。

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            ...
            "stopAtEntry": true,   // 将 stopAtEntry 设置为 true
            ...
        }
    ]
}
```

## 代码片段 snippets


> 代码片段（Code Snippets），指的是一些使用率很高的代码模板，可以是固定的内容（比如文件头的版权声明），或者是可以修改的预定义模板，比如for、while循环的模板。 通过Snippet，输入特定的关键词，就可以在代码段引擎的帮助下，生成预定义的模板代码，接着我们还可以通过在预定义的光标位置之间跳转，来修改补全模板，得到我们最终想要的代码。

- [vscode进阶：运用代码片段提高效率 - 知乎](https://zhuanlan.zhihu.com/p/357377511)
- [VSCode 利用 Snippets 设置超实用的代码块](https://juejin.cn/post/6844903869424599053)
- [Custom C++ User Snippet in Visual Studio Code - GeeksforGeeks](https://www.geeksforgeeks.org/custom-c-user-snippet-in-visual-studio-code/)
- [在线vscode代码片断生成](https://snippet-generator.app/)
- [VS Code 代码片段完全入门指南](https://www.freecodecamp.org/chinese/news/definitive-guide-to-snippets-visual-studio-code/)

下面是一个例子

```json
<%-include("./cpp.json") _%>
```
