---
title: 树上启发式合并
status: TODO
---


一个用来统计数上信息的算法,需要统计的算法具有下面的特点

- 信息结构比较大,只能用全局变量来记录


**核心**:树上的一个点u会被访问多少次?

这个次数和点u到root路径上的轻重边的数量有关系:

每次跨链(走轻边)都会导致点u所在的子树重新刷新

但是一个点最多跨logn条轻边,总时间nlogn,非常美.


