[[TOC]]

## 边数

判断一个图上是否有负环,

> 根据`[[belman-ford]]`的思想在一个无负环的图G上的任意两个点$u,v$之间的最短路所经过的边的的数量不超过$n-1$.

我们有以下的方法去判断一个图是否存在负环

推论1: 设$dis(u)$表示点$u$的最短路,$dis_{cnt}(u)$表示点u的最短路径所经过的的边的数量,

::: pseudocode
\begin{algorithm}
\begin{algorithmic}
\IF{$dis(u) < dis(v) + w(u,v)$ }
\STATE $dis(u) = dis(v)+w(u,v)$
\STATE $dis_{cnt}(u) = dis_{cnt}(v)+1$
\ENDIF
\end{algorithmic}
\end{algorithm}
:::

若某时刻$dis_{cnt}(u) > n-1$,则证明此时有图$G$上有负圈.

那么我们可以写出一个在基于队列的spfa算法查找负圈的代码如下:

```cpp
<%- include("./spfa_1.cpp")%>
```

## 更新的次数

推论2: 若$A$:图G中存在负圈,则$B$:存在一个点v,在spfa算法被更新的次数大于$n-1$
,n为顶点数.

证明

$A \to B$

需要证明

$\neg B \to \neg A$

已知道C: 图中最短路经过边的数量$< n$ ,且已知 $\neg A \Leftrightarrow C$


现在只需要证明$\neg B \Leftrightarrow C$

即找到点更新次数与最短路径边数之间的关系.

可以想到: 每当发生一次松弛,那么就产会产生一次更新.那么在无负圈的图上,最我松弛多少次呢?根据Bellman-Ford算法,最多松弛$n-1$次.


根据`[[belman-ford]]`定理2,任意点的松弛(更新)都不能超过n,所以我们直接在spfa算法上记录某个点的更新次数就可以了.


## dfs版spfa


前置算法

1. 用dfs判断图上是否有圈: 通过非父子边遇到一个已经走过的点

根据上式,使用dfs版本的spfa,当一个点能松弛时,才向前dfs


可以想到dfs写spfa的最坏时间为

- 指数级
- $n \times m$

那么这个方法,不一定能上来就找到负圈.不是一个好的算法.

## 总结

上面的三种方法就是我能想出来的判断负圈的三种方法.显然第一种方法是最好的.
掌握第一种方法就可以了,它的代码也是最容易写的.



## 参考

- [深入理解Bellman-Ford（SPFA）算法_spfa算法-CSDN博客](https://blog.csdn.net/u011893609/article/details/81232124)
- [浅谈SPFA判负环 - acioi - 博客园](https://www.cnblogs.com/acioi/p/11694294.html)
