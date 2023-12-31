---
title: 数字距离
author: rainboy
update_time : 2023-09-05
status: TODO
---

[toc]

# 数字距离

## 问题

在一个数轴上,有两个数字$i$和$j$,问:

- $i$到$j$之间,包括$i$,不包括$j$,有多少个数?
- $i$到$j$之间,包括$i$,包括$j$有多少个数?

例如求$3 \rightarrow 9$的距离


![pic-include](./asym/pic.svg "include 包含9")

![pic-exclude](./asym/pic-exclude.svg "exclude 不包含9")


这显然是一个非常的问题,但是我们后面的写的代码,只要涉及到两个数字之间的距离,就会遇到这两个问题.
所以这里我把它们独立出来.

第一个问题,我称为``dis\_ex``,英文为``distance\ exclude``
第二个问题,我称为``dis\_in``,英文为``distance\ include``

代码为

```cpp
<%-include("./template.cpp")%>
```

## 总结

请记住:

- 我们常常使用的两个数字相减$j-i,3-2,10-5$,所求的距离值其实是**不包含起始位置或终止位置**的.
- 如果要包含**起始位置或终止位置**需要在结果加$1$

你可能会觉得上面的代码或想法太简单了,尝试下面的想法

- 相对位置
  - 你在位置j,求j前面的i个位置,不包括j,是多少?
  - 你在位置j,求j前面的i个位置,包括j,是多少?
  - 你在位置t,求t后面的x个位置,包括t,是多少?
  - 你在位置t,求t后面的x个位置,不包括t,是多少?
  - 你在位置j,
- 求两者的距离

