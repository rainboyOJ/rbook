[[TOC]]

## 什么是对拍

## 简单对拍模板

```bash
<%- include("./compare.sh") _%>
```

## 复杂对拍模板

功能:

- 自动编译相应文件


```bash
<%- include("./compare_complex.sh") _%>
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

```bash
<%- include("./check.sh") _%>
```