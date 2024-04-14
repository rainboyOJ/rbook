---
title: 有用的软件
---

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

