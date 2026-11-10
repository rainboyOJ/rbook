---
title: 贪心说明
rbook:
  id: greedy
---

[[TOC]]

> From Wikipedia  
> A greedy algorithm is any algorithm that follows the problem-solving heuristic of making the locally optimal choice at each stage. In many problems, a greedy strategy does not produce an optimal solution, but a greedy heuristic can yield locally optimal solutions that approximate a globally optimal solution in a reasonable amount of time.

贪心类问题无疑是基础算法中难度最大的，难点在于思维的跳跃性，没有固定的解题模式，往往是一类题一种解法或结论。

**贪心算法 (Greedy Algorithm)** 这样的称呼，往往让刚学习的朋友会误解这类题目的特性。

**Greedy Algorithm** 实际上是在每个阶段做出 **启发式（heuristic）** 的 **局部最优化选择**，从而达到 **全局最优化** 的行为。

**heuristic** 在数学最优化问题中的定义：a technique designed for solving a problem more quickly when classic methods are too slow or for finding an approximate solution when classic methods fail to find any exact solution 即在常规方法不能有效求解时，需要用到的启发式求解（这也就是为什么贪心问题特别杂，往往一题一结论，很难掌握）。

如果用 “状态空间” 来理解的话，**动态规划 (Dynamic Programming)** 在每个 **stage** 求解所有需要的状态实现递推。

而 **贪心算法 (Greedy Algorithm)** 则是在每个 **stage** 根据 **启发式策略** 只去求解部分解实现递推。

从 “集合” 来理解的话，DP 就是把每个状态集合都求干净进行递推；贪心则是每次求集合中的符合策略的一部分递推。

之前也说过，贪心类题目没有固定解题模式，不像数据结构计算几何可以一步步推理得出，贪心解法具有跳跃性。

使用贪心算法要求问题的整体最优性可以由局部最优性导出。

因此，我们可以从局部最优策略下手，证明该策略也可以实现整体最优。

常见的证明手段：

1. **微扰（邻项交换）**  
   证明在任意局面下，任何对局部最优策略的微小改变都会造成整体结果变差。  
   常用于以 “排序” 为贪心策略的证明（减少逆序对不会使整体结果变差）。
2. **范围缩放**  
   证明任何对局部最优策略作用范围的扩展都不会造成整体结果变差。
3. **决策包容性**  
   证明任意局面下，做出局部最优决策以后，在问题状态空间中的可达集合包含了做出其他任何决策后的可达集合。  
   换言之，这个局部最优策略提供的可能性包含其他策略提供的可能性。
4. **反证法**
5. **数学归纳法**

## 贪心的模型

1. **区间问题**
   1. **区间选点**
      1. 问题：数轴上选尽可能少的点，使得每个区间内至少有一个点。
      2. 启发策略：区间按右端点排序，若当前区间包含当前的点，则不加入新点，否则更新新点为右端点。
   2. **最大不相交区间数量**
      1. 问题：数轴上有若干区间，选出最大不相交区间。
      2. 启发策略：与上一个问题等价，右端点排序，若当前区间与正在维护的区间相交，则不选，否则选上当前区间并维护。
   3. **区间分组**
      1. 问题：数轴上有若干区间，给这些区间分组，使得每组内不相交。
      2. 启发策略：区间按左端点排序，若当前所有组中最后一个加入的区间右端点都大于当前区间左端点，则开新组，否则接在最小的后面。
   4. **区间覆盖**
      1. 问题：选择尽可能少的区间，覆盖一个线段。
      2. 启发策略：区间按左端点排序，找出所有左端点在当前已覆盖的区间内，最远的右端点位置，更新已覆盖区间，继续枚举。
2. **Huffman 树模型**
   1. 问题：给出几个带权点，每次可以合并几个点，求最小带权路径长。
   2. 启发策略：每次选最小的几个点合并。
3. **排序不等式**
   1. 问题：小学奥数的排队打水问题。
   2. 启发策略：按照时间递增排序。
4. **绝对值不等式**
   1. 详情见 “排序” 章节。
5. **双机流水调度（Johnson）**
   1. 问题：每个作业先在机器 A 上加工 $a_i$、再在机器 B 上加工 $b_i$，求全部完工的最短时间。
   2. 启发策略：$a_i<b_i$ 的作业按 $a_i$ 升序排在前，$a_i\ge b_i$ 的按 $b_i$ 降序排在后。它同样是邻项交换推出比较式，但那个比较式**不满足严格弱序**，必须再做集合划分才能交给 `sort`——详见 [[[rbook: greedy_johnson]]]。
6. **模拟退火**
   1. 问题：找多峰函数的极值。
   2. 启发策略：这个内容很多，以后章节会详细讲。

## 例题

每个模型配一道完整例题，题面、贪心策略、正确性证明与代码都在同一页。

| 题目 | 对应模型 | 核心策略 |
| --- | --- | --- |
| [[[rbook: greedy_sunscreen_problem]]] | 区间选点 | 按右端点排序，每次用掉最小的可用防晒霜 |
| [[[rbook: greedy_cattle]]] | 区间分组 | 按左端点排序，用小根堆维护各组右端点 |
| [[[rbook: greedy_radar]]] | 区间选点 | 把海岛的覆盖范围转成区间，按右端点排序 |
| [[[rbook: greedy_king_game]]] | 排序不等式 | 按左右手乘积排序，高精度比较 |
| [[[rbook: greedy_tree_dyeing]]] | 排序不等式 | 每次合并平均权值最大的点 |
| [[[rbook: greedy_johnson]]] | 双机流水调度 | 按 $a_i<b_i$ 分组，前组 $a$ 升序、后组 $b$ 降序 |
| [[[rbook: greedy_equal_card]]] | 排序不等式 | 前缀和与中位数 |
| [[[rbook: greedy_delete_number]]] | 相邻比较 | 每次删掉第一个比后面大的数 |

其中 [[[rbook: greedy_sunscreen_problem]]] 与 [[[rbook: greedy_radar]]] 都归到「区间选点」，
但建模方式不同：防晒是拿点去配区间，雷达是把二维的覆盖范围转成一维区间。
[[[rbook: greedy_cattle]]] 是「区间分组」，对应区间图的着色问题。
[[[rbook: greedy_johnson]]] 与前面几篇不同：它的比较式推出来**不能直接当 `cmp`**，
需要先做集合划分，是「邻项交换」这条线上必须跨过的一道坎。

## 练习题目

- [[[p: luogu-P2887]]]
- [[[p: luogu-P2859]]]
- [[[p: luogu-P1080]]]
