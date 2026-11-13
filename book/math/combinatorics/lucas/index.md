---
title: 卢卡斯定理
rbook:
  id: lucas
  pre:
    - combinatorics
    - remainder
    - prime
---

[[TOC]]

## 阅读路线

先用 [[[rbook: combinatorics]]] 理解组合数，再通过 [[[rbook: remainder]]] 和 [[[rbook: prime]]] 理解同余运算与素数条件。Lucas 定理处理组合数对素数取模的问题，不能把素数条件直接略去。

本文保留了对证明中“比较系数”步骤的疑问。多项式系数与计数之间的联系，可以结合 [[[rbook: generating_function]]] 的主题继续学习；这是一条理解证明的补充路线，不是要求先学完生成函数才能接触 Lucas 定理。


## 证明


目前我见到的最好的证明: https://forthright48.com/lucas-theorem-proof-and-applications/

我看了多个证明,最后一步都是转成



$$
\begin{aligned}
(1+x)^n &= (1+x)^{sp+q} \\
&=[(1+x)^p]^s \times (1+x)^q
&\equiv (1+x^p)^s \times (1+x)^q \quad (mod\quad p) \\
&\equiv \sum_{i=0}^s\binom{s}{i}x^i \times \sum_{j=0}^p \binom{p}{j}x^j \quad (mod\quad p)
\end{aligned}
$$

关键在于最后一步:对比系数:比较左式的$(1+x)^n$里$x^m$的系数是$\binom{n}{m}$,然后证明右式的$x^m$的系数是一定只是唯一的,且为$x^tp \times x^r$的系数.然后怎么怎么.

所以上面的最后一步的证明,就是类似的想法:
$(a+b) \equiv (c+d) \mod p$,所以$a \equiv c \mod p$.
我不能接受.

如果谁能理解,请告诉我. mail: rainboylvx@qq.com

## 参考

- https://blog.csdn.net/Qiuker_jl/article/details/109528164
- [算法学习笔记(25) 卢卡斯定理 - 知乎](https://zhuanlan.zhihu.com/p/116698264)
