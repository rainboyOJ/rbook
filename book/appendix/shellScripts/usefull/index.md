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

## `/usr/bin/time`

可以查看程序的运行时间和内存


```bash
/usr/bin/time  2.out < in
	Command being timed: "2.out"
	User time (seconds): 0.00 <- 执行的时间
	System time (seconds): 0.00  <- 执行的时间
	Percent of CPU this job got: 80%
	Elapsed (wall clock) time (h:mm:ss or m:ss): 0:00.00
	Average shared text size (kbytes): 0
	Average unshared data size (kbytes): 0
	Average stack size (kbytes): 0
	Average total size (kbytes): 0
	Maximum resident set size (kbytes): 10032 <- 占用的最大内存
	Average resident set size (kbytes): 0
	Major (requiring I/O) page faults: 0
	Minor (reclaiming a frame) page faults: 168
	Voluntary context switches: 1
	Involuntary context switches: 0
	Swaps: 0
	File system inputs: 0
	File system outputs: 0
	Socket messages sent: 0
	Socket messages received: 0
	Signals delivered: 0
	Page size (bytes): 4096
	Exit status: 0
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
