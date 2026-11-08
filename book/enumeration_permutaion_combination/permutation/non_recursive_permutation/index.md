---
title: 非递归实现排列
rbook:
  id: non_recursive_permutation
---

[[TOC]]


::: note label=核心


我们先从最小的排序开始，依次寻找比当前排序大的最小排序，实现该方法的关键就在于寻找交换点和交换数。

:::


```cpp file=./1.cpp
```
