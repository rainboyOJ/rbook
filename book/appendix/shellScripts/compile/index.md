
## 说明

在平时写代码的时候,每一次都需要输入`g++ -g -o 1 1cpp`,然后`./1 < in` ,显然这样拖累了我们写代码的速度,于是我写一个编译脚本`b`,它可以

- 自动选择当前目录下的`cpp`文件
- 自动重定向输入输出文件

## 安装

先安装依赖

```bash
sudo apt install -y fzf
```

### 安装到HOME目录

- 优点:不污染其它目录
- 缺点:需要设置一下`.bashrc`,或`.zshrc`


1. 下载

```bash
mkdir ~/.bin
curl -o ~/.bin/b <%= self_host _%>appendix/shellScripts/compile/b.sh
chmod +x ~/.bin/b
```
2. 配置`.zshrc`或配置`.bashrc`

通过命令`echo $SHELL`来确定使用的是哪个shell

如果你使用的是zsh

```bash
gedit ~/.zshrc
```

如果你使用的是bash

```bash
gedit ~/.bashrc
```

在末尾添加

```bash
export PATH=$PATH:$HOME/.bin
```

关闭终端,重新打开


### 安装到`/usr/bin`目录

- 优点:简单
- 缺点:污染`/usr/bin`目录

```
sudo curl -o /usr/bin/b <%= self_host _%>appendix/shellScripts/compile/b.sh
sudo chmod +x /usr/bin/b
```

## 使用

```
b --help
```

## 配置文件

如果不想要每一次都使用重复的参数,可以创建配置文件`~/.config/roj/b.conf`

例如

TODO

## 使用例子

- 选择代码与默认输入文件`in`,直接`b`
- 编译`foo.cpp`:  `b foo`,`b foo.`,`b foo.cpp`
- 选择代码与输入文件,设定输出文件为`1.out`,直接`b -t 1.out`
- 不重定向输入文件,编译后直接执行,直接`b -I`
- 只编译,不执行,直接`b -n`

## 完整脚本

```bash
<%- include("./b.sh") %>
```
