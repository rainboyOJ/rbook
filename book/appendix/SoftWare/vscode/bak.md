## 如何用vscode写c++代码

思来想去,觉得还是NoiLinux2.0(ubuntu20.04)中自带的vscode最适合学生用来写代码
因为它丰富的插件,以后学生还可以基于它来做很多事情!

::: warning
注意: 比赛提供的环境,如果没有联网初始化vscode,可能会有点小问题.我曾经出过个视频(可以问我).
:::

## 1. 配置

不需要配置

### 1.1 常用的插件

- c/c++ 一定要安装
- chinese language 中文界面

### 1.2 常用的配置

- 自动格式化 `设置 -> default Formatter :c/c++, Format on Paste ,Format on Save , Format on Type`
- 彩色括号 `设置-> bracket pair colorization`


## 2. 写代码

第一次打开`vscode`,会自动下载一个`c/c++ language components`的东西

```
file -> new file -> select language ->选c++
```

写入下面的代码

```cpp
#include <iostream>
int main(){
    std::cout << "hello";
    return 0;
}
```

- [[ctrl]] + [[s]] 保存代码
- 保存时,创建一个`code`文件夹,并打开
- 命名为`1.cpp`,点保存


注意,如果你以后想要就在`code`目录下写代码,点击左侧边栏的`open folder`,选择刚才创建的
`code`目录,那么左侧样就会变成code目录的内容,这样以后写代码比较方便

## 3. 编译运行

1. [[ctrl]] + [[alt]] + [[arrow down]] 打开一个新的桌面
2. [[ctrl]] + [[alt]] + [[t]] 打开终端,输入编译命令

输入如下命令

```bash
# 进入code目录
cd code

# 手动编译

g++ -g -o 1 1.cpp

#运行
./1
```

## 4. 调试

有两种调试的方式
1. 给vscode安装插件
2. (推荐)看我的 如何调试 这篇文章 TODO

## 5. vscode 常用快捷键

[官方文档:快捷键](https://code.visualstudio.com/docs/getstarted/keybindings)


注释

- 单行注释 [[ctrl]]+[[/]],如果再按一次,取消注释
- 多行注释 [[ctrl]]+[[/]]

行操作

- 向下/上移动当前行：[[alt]] + [[⬇] / [[⬆]
- 选中当前行： [[ctrl]]+[[l]]
- 删除当前行：[[shift ]]+ [[ctrl ]]+ [[k]]
- 行增加缩进： [[ctrl ]]+ [[\[]]
- 行减少缩进： [[ctrl ]]+ [[\]]]
- 复制当前行到上一行：[[shift]]+ [[alt]] +[[up]]
- 复制当前行到下一行：[[shift]]+ [[alt]] +[[down]]
- 向下新起一行： [[ctrl]] + [[enter]]
- 向上新起一行： [[ctrl]] + [[shift]] + [[enter]]

常用

- 撤销 : [[ctrl]] + [[z]]
- 反撤销 : [[ctrl]] + [[shift]] + [[z]]
- 向下/下卷屏: [[ctrl]]  + [[⬆]] / [[⬇]]
- 向左/右跨越单词: [[ctrl]]  + [[⬅]] / [[➡]]
- 向下/上同时编辑多行(多行光标) : [[ctrl]] + [[shift]] + [[⬆]] / [[⬇]]

其它

- 显示/隐藏左侧目录栏 [[ctrl]] + [[b]]
- 控制台终端显示与隐藏：[[ctrl]]+ [[`]]
- 切换全屏： F11
- 格式化整个文件：[[ctrl]] + [[shift]] + [[i]]

## 使用 vscode 编写 markdown

::: info
记住!写的题目一定写笔记,如果没有写笔记,很容易遗忘.
:::

10分钟,看完这个文档 [younghz/Markdown: Markdown 基本语法。](https://github.com/younghz/Markdown) ,你会markdonw了

最好的写markdown笔记的软件,就是vscode,因为免费,简单

只要安装插件就可以了

- `Dendron Markdown Preview Enhanced`

- 1. 打开侧边栏的[[拓展]]按钮
- 2. 搜索对应的插件,点击安装
- 3. 创建一个markdown文档
- 4. [[ctrl]]+[[shift]]+[[v]],然后开始编写markdown
- 5. 查看[中文文档](https://shd101wyy.github.io/markdown-preview-enhanced/#/zh-cn/)

![](https://user-images.githubusercontent.com/1908863/28227953-eb6eefa4-68a1-11e7-8769-96ea83facf3b.png)


- [使用-快捷键](https://shd101wyy.github.io/markdown-preview-enhanced/#/zh-cn/usages)


参考:[Can't preview with Ctrl + K V & Ctrl + Shift + V if other markdown viewers are installed · Issue #82 · marp-team/marp-vscode](https://github.com/marp-team/marp-vscode/issues/82)

如何在在侧边打开预览

- [[ctrl]] + [[shift]] + [[p]]
- 输入`markdown preview`回车
- 当然也可以设置自己的快捷键(上一步时)



## 参考

- [Visual Studio Code插件手动安装\_程序Yuan\_\_的博客-CSDN博客\_安装vscode插件](https://blog.csdn.net/u014005893/article/details/108998376)
