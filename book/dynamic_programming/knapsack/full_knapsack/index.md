[[TOC]]

## 问题引入

<%- include("./problem.md") %>

## 解法1,$O(n^3)$


<%- iframe("/canvas/full_knapsack")%>

设$Q(i,j)$表示前$i$物品**在每个物品可以选多次的情况下所有合法(所选的物品的重量和小于等于$j$)选法**组成的集合,这一个有重集(每个元素可以重复出现多次),显然$\max \{sum(x) | x \in Q(i,j) \} = f(i,j)$,其中$sum(x)$表示选法$x$所选对应物品的重量和,符合**每一个问题对应一个集合**的规律


现在考虑最后一个物品$i = (w_i,v_i)$,根据是否含有$i$,显然可以把集合$Q(i,j)$分成两**不重不漏**的两个集合:

1. 集合$B$表示$i$没有出现(一个也不选),这个时候$B = Q(i-1,j)$,对应的答案就是$f(i-1,j)$.
2. 集合$C$表示$i$有出现, 然后在根据物品$i$出的次数,对集合$C$进行分类
  - 可能出现$1$次,设为$C_1$,转化对应的问题为$f(i-1,j- w_i) + v_i$
  - 可能出现$2$次,设为$C_2$,转化对应的问题为$f(i-1,j- 2 \cdot w_i) + 2 \cdot v_i$
  - $\cdots$
  - 最多可能出现$k$次,设为$C_k$. 显然$k = \lfloor \frac{j}{w_i} \rfloor$,转化对应的问题为$f(i-1,j- k \cdot w_i) + k \cdot v_i$

显然,可以得出


$$
\begin{aligned}
f(i,j) &= \max\{ Q(i,j) \} \\
    &= \max\{ \max B, \max C    \} \\
    &= \max\{ \max B, \max C_1 ,\max C_2 ,\cdots , \max C_k  \} \\
    &= \max\{ f(i-1,j), f(i-1,j-w_i) ,f(i-1,j- 2 \cdot w_i) + 2\cdot v_i, \cdots, f(i-1, j - k \cdot w_i) + k \cdot v_i   \} \\
    &= \max\{f(i-1, j - k \cdot w_i) + k \cdot v_i   \} , 0 \leqslant k \leqslant  \lfloor \frac{j}{w_i} \rfloor  \\
\end{aligned}
$$


于是我们得到一般的状态转移方程

```math
f(i,j)=
\left\{
\begin{array}{ccc}
 0&  i==0 \lor j == 0 \\
 f(i,j-k \times w_i) + k \times v_i &  0 \leqslant k \land  k \times w_i \leqslant j  & \text{选$k$个物品$i$} \\
\end{array}
\right.
```


那么这样的话,我们可以得到一个$O(n^3)$算法的

::: fold

```cpp
<%- include("./code/n3.cpp") _%>

```
:::

## 解法2, 转成01背包


很容易想到,虽然题目说:每个物品有无限个.但因为容量是有限的,所以不可以无限的去放某个物品$i$,那么对于某个物品$i$来说,最多选$k_i = \lfloor \frac{j}{w_i} \rfloor$个. 转变一个思路,可以认有$k_i$个物品$i$让你来选,也就是可以认为有$k_i$个不同的物品,但它们的重量和价值都是相同的,都是$(w_i,v_i)$.

于是我们成功的把问题转化成了一个01背包问题.

如果要用二维数组存储$f(i,j)$，也就是需要计算每个物品的$k_i$,然后具体计算$\sum k_i$,这能才能知道需要二维数组的行数.

因为01背包的一维写法不需要开二维数组,那就是不需要计算行数了,减少了计算量.所以这里使用01背包的一维写法.

得到一个$O(n^3)$的代码如下:

::: fold

```cpp
<%- include("./code/n3_01.cpp") _%>

```
:::



## 解法3优化,$O(n^2)$



$Q(i,j)$集合的子集合$C$里每一个元素$x$都一定含有一物品$i$,好,现在把每个元素都去除一个物品$i$,变成了一个新的集合$D$,显然$D$里的每个元素$y$的价值和$sum(y) <= j-w_i$.

**显然:** 集合$D$就是问题$f(i,j-w_i)$对应的集合


::: info

选$k(k \geqslant 1)$个物品$i$,等价描述为,至少选$1$个物品$i$  
$Q(i,j-w_i)$集合对就的问题就是$f(i,j-w_i)$,可能选了物品$i$,也可能没有选物品$i$

在$Q(i,j-w_i)$集合的每个元素是添加一个物品$i$,变成新集合$Q(i,j)$,那么就是至少选一个.

:::

我们成功应用了集合一一映射的思想,把一个问题转成了另一个问题.


```math
f(i,j)=
\left\{
\begin{array}{ccc}
 0&  i==0 \lor j == 0 \\
 f(i-1,j) & j<w[i] \\
 \max \left\{
\begin{array}{cc}
 f(i-1,j) &\text{不选物品$i$} \\
 f(i,j-w_i) + v[i]  &\text{至少选一个物品$i$} \\
\end{array}
\right.   
& j \geqslant w_i
 
\end{array}
\right.

```


<%- video("fullbackpack_2d.mp4") _%>

```cpp
<%- include("./code/n2.cpp") %>
```

## 优化2,降维

<%- video("fullbackpack_1d.mp4") _%>

仔细观察动画,类比[[[rbook: 01knapsack]]]的思想,根据每个点需要的转移点的位置,可以把$f[i][j]$降成$f[j]$


```cpp
<%- include("./code/one_dimensional.cpp") %>
```

## 练习题目

- luogu-P1616 疯狂的采药 入门题目

+p THIS_ID
