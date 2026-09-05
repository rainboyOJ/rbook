---
title: "分数类"
status: "TODO"
---


# 分数类

[[TOC]]

## 目的 / 适用情况

有的时候需要对两个整数进行除,得到`double`进行比较大小,但是`double`的精度可能不够
又会用`long double`.

我们设计一个分数类,同时存分子分母,表示两个数除后的结果.

## 模板

```cpp
<%- include("code/fraction_class_template.cpp") _%>
```

想一想

- 为什么,无穷大,无穷小的分数类是这么创建的
