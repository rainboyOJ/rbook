[[TOC]]

## 什么是对拍

## 简单对拍模板

```bash file=./compare.sh
```

### 如何执行

这个脚本默认同目录下有三个程序：`r` 是数据生成器、`1` 是被测程序、`2` 是标准答案。把它们编译好之后：

0. 删除第一行的 `#!/bin/bash`
1. 保存成 `dp.sh`（对拍的拼音首字母），放在和 `r`、`1`、`2` 同一个目录
2. 在终端执行：

```bash
bash dp.sh
```

::: warning
为什么要把 `#!/bin/bash` 删掉？因为在 Windows 编辑器里复制粘贴时，这一行很容易变成 CRLF 换行（末尾多个 `\r`），
一旦你习惯性地写 `./dp.sh` 去执行，就会报 `/bin/bash^M: bad interpreter: No such file or directory`。
既然统一用 `bash dp.sh` 显式调用解释器，shebang 就只是普通一行注释，留着只会误导，不如删掉。
:::

输出里先是一串数字进度（`printf "\r$i"` 原地刷新），跑到有差异的那组时，`diff` 会把两边答案打出来，
同时目录里留着 `in`、`out1`、`out2` 三个文件，可以直接 `cat in` 看反例，不需要脚本替你打印。

## 复杂对拍模板

功能:

- 自动编译相应文件


```bash file=./compare_complex.sh
```


## check脚本

如果你有一个`data`文件夹,里面有很多的数据,你需要检查你的代码`1.out`能否通过所有的数据,怎么办?

```
./data
├── problem0.in
├── problem0.out
├── problem1.in
├── problem1.out
├── problem2.in
├── problem2.out
├── problem3.in
├── problem3.out
├── problem4.in
├── problem4.out
├── problem5.in
├── problem5.out
├── problem6.in
├── problem6.out
├── problem7.in
├── problem7.out
├── problem8.in
├── problem8.out
├── problem9.in
└── problem9.out

1 directory, 20 files
```


可以使用这个脚本,

TODO : 添加timeout.

```bash file=./check.sh
```