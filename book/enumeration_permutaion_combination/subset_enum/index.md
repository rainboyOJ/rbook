---
title: 子集枚举
rbook:
  id: subset_enum
  pre:
    - ball_and_box
    - binary
  code_template:
    - title: 子集枚举 subset_enum
      tags:
        - enum
        - binary
      desc: 二进制子集枚举
      code: ./subset_enum.cpp
---

[[TOC]]

## 阅读路线

先在 [[[rbook: ball_and_box]]] 中理解“固定选取个数”和“允许任意个数”的区别，再用 [[[rbook: binary]]] 理解掩码中每一位的含义。

子集与 [[[rbook: 01_seq]]] 一一对应：第 $i$ 位表示第 $i$ 个元素是否被选中。若固定选 $k$ 个元素，方案数可以对照 [[[rbook: combinatorics]]] 中的组合数；若全部 $2^n$ 个选择已经太多，可以继续学习 [[[rbook: meet_in_the_middle]]]。

TODO 我以前写的文章


## for实现

如果你枚举子集的原集的二进制表示为$2^x$,也就是对应的二进制表示全为1,那么就可以使用这种方案.

正好就是[[[rbook: 01_seq]]]的另一种实现


```cpp file=./for_subset_enum.cpp
```

## 全组合

见 [[[rbook: ball_and_box]]]对应的内容

## 二进制

```cpp file=./subset_enum.cpp
```
