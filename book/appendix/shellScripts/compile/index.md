
## 说明

在平时写代码的时候,每一次都需要输入`g++ -g -o 1 1cpp`,然后`./1 < in` ,显然这样拖累了我们写代码的速度,于是我写一个编译脚本`b`,它可以

- 自动选择当前目录下的`cpp`文件
- 自动重定向输入输出文件

## 安装

先安装依赖

```bash
sudo apt install -y fzf
```

```
sudo curl /usr/bin/b https://raw./bin/b.sh
sudo chmod +x /usr/bin/b
```

## 使用

```
b --help
```

## 配置文件

如果不想要每一次都使用重复的参数,可以创建配置文件`~/.config/roj/b.conf`

例如

```
-std c++20
```

## 使用例子

- 选择代码与输入文件,直接`b`
- 编译`foo.cpp`:  `b foo`,`b foo.`,`b foo.cpp`
- 选择代码与输入文件,设定输出文件为`1.out`,直接`b -o 1.out`
- 不重定向输入文件,编译后直接执行,直接`b -ni`
- 只编译,不执行,直接`b -nr`

## 完整脚本

```bash
<%- include("./b.sh") _%>
```
