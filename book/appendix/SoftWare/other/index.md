
## luogu题目快速跳转搜索书签

**书签的基本形式**：

-   书签通常是一个URL，但在特殊情况下，书签的URL字段可以包含JavaScript代码。这种书签被称为JavaScript书签或书签let。
-   JavaScript书签的格式通常为：`javascript: (() => { // Your code here! })();`。其中，`javascript:`是协议头，表示这是一个JavaScript书签；`(() => { })`定义了一个匿名函数（也称为lambda函数）；在花括号`{}`之间编写要执行的代码；最后的`();`用于执行该匿名函数。

-   **编写JavaScript代码**：
    
    -   根据需要，在书签的URL字段中编写JavaScript代码。例如，要显示一个警告框，可以编写：`javascript: (() => { alert('Hello, World!'); })();`。
-   **创建书签**：
    
    -   在浏览器中，打开书签管理器（在Safari中，可以通过菜单栏的“书签”选项找到“添加书签”或“显示书签”来访问书签管理器）。
    -   右键单击书签栏或书签管理器中的某个位置，选择“添加书签”或“添加页面”。
    -   在弹出的对话框中，为书签命名，并在URL字段中输入上面编写的JavaScript代码。
    -   点击“添加”或“保存”按钮，完成书签的创建


```bash
javascript: (function(){ var h = 'https://www.luogu.com.cn/problem/P'; var id = prompt("输入luogu跳转的id或搜索");if(!id) return;if(/^\d+$/.test(id)) window.open(h+id); else window.open('https://www.luogu.com.cn/problem/list?keyword=%27+id+%27&page=1%27); })();
```

- 参考: [如何制作JS书签并导入 safari每天一个小小的知识点，突破自己的知识盲区。本期是如何制作JS书签并导入 safari - 掘金](https://juejin.cn/post/7439785794917122048)

## 视频播放器, vlc

[vlc官网](https://www.videolan.org/) : https://www.videolan.org/

```bash
sudo apt install -y vlc
```

## ttyd

Github地址: [tsl0922ttyd Share your terminal over the web](https://github.com/tsl0922/ttyd)

可以把我们的终端分享到网络上,很方便的我的教学

这是我常用的命令


```sh
ttyd -R -p 9999 -t fontSize=20 tmux new -A -s ttyd zsh

# other terminal
tmux attach -t ttyd

# use nvim to edit cpp code
# will real-time show my code in browser
```

然后学生通过浏览打开`<my laptop ip>:9999`,就可以实时地在浏览器中看到我编写代码

## xfce4-terminal

`xfce4-terminal`有`drop down`模式,帮助我们使用更快的使用终端,替代默认的`gnome-terminal`

