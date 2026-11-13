---
title: 非递归实现排列
rbook:
  id: non_recursive_permutation
  pre:
    - full_permutation
---

[[TOC]]

## 阅读路线

先通过 [[[rbook: full_permutation]]] 理解需要枚举的完整方案集合。本文改用字典序，从当前排列寻找紧接着的下一个排列；选择顺序与递归生成不同，目标仍是把各个排列恰好生成一次。

有重复元素时，可以与 [[[rbook: not_repeat_permutation]]] 对照，区分按数值不同的排列和按元素编号不同的排列。


::: note label=核心


我们先从最小的排序开始，依次寻找比当前排序大的最小排序，实现该方法的关键就在于寻找交换点和交换数。

:::


```cpp file=./1.cpp
```
