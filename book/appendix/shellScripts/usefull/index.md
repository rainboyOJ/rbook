## `diff`

`diff`命令可以找到两个文件文件的不同点

执行下面命令创建文件

```bash
cat << EOF > 1.txt 
1
2
3
EOF
```

```bash
cat << EOF > 2.txt 
1
3
3
EOF
```

执行命令`diff -b 1.txt 2.txt`

输出

```
2c2
< 2
---
> 3
```

表示文件有不同

如果两个文件相同，例如`diff -b 1.txt 1.txt`
则什么也不输出

## vimdiff

执行`vimdiff`可以在`vim`查文件的不同，有更好的界面

```sh
vimdiff 1.txt 2.txt
```

输入`:q!`退出


## `timeout`

可以限制程序运行的时间

```sh
timeout 1.1s ./1.out < in > out
```

## ulimit

限制程序运行的内存,单位`kb`

设置当前终端下的所有程序运行的内存为`128mb`
```
ulimit -v 131072
```

## 脚本

根据上面的合集，我们可以写出一个简单的评测脚本

在我们比赛时，可以配合`rand.cpp` 随机数据生成程序，进行对拍

是一个很有用的脚本

```sh
TODO
```
