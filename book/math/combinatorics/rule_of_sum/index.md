---
title: 分类加法计数原理
rbook:
  id: rule_of_sum
  pre:
    - set
---

[[TOC]]

## 阅读路线

先用 [[[rbook: set]]] 理解集合、交集和元素个数。本文解决的是把所有方案分成若干类，再把各类的数量加起来；需要检查每个方案是否恰好属于一类。

读完可以用 [[[rbook: pair_number]]] 练习按结尾分类；与之对照的“分步骤完成一件事”见 [[[rbook: rule_of_product]]]。若分类之间存在重叠，需要进一步学习 [[[rbook: inclusion-exclusion]]]。

## 分类加法计数原理

有两个集合$A = \{a_1,a_2,a_3\},B=\{b_1,b_2\}$
,可知$A \cap B = \varnothing$,集合$C$定义如下,$C = \{x \mid x \in a \text{ or } x \in b\}$,问集合$C$的元素数量是多少,即$|C|$


如果完成事件$C$可以分类成完成$A$或$B$两种事件. 且
1. 只能分成$A,B$(不重)
2. 事件$A$与事件$B$完全不相关(不漏,即$A \cap B = \varnothing$)

则可以这样说:完成事件$C$的方法数等于完成事件$A$的方法数加上事件$B$的方法数


![figure 1](./images/rule_of_sum_1.svg "figure 1")
