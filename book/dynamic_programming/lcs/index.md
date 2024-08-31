## 题目

https://roj.ac.cn/roj/1265/index.html

## 动画


<%- iframe("/canvas/lcs")%>


## 解析

得到状态转移方程如下:

$$
f(i,j) = \left\{
\begin{array}{cr}
max\{f(i-1,j),f(i,j-1)\} & \\
max\{f(i-1,j),f(i,j-1),f(i-1,j-1)+1\} & a_i = b_j \\
0 & i = 0 \lor j=0
\end{array}
\right. \tag a
$$

证明:

设

- 第一个字符串为$S_1$,第二个字符串为$S_2$
- $S_1$的最后一个字符为$a_i$, $S_2$的最后一个字符为$b_j$
- 问题: $S_1$和$S_2$的最长公共子序列长度是多少,表示为$f(S_1,S_2)$
- $P(S_1)$表示为$S_1$的所有子序列
- 集合$A=\{x | x \in P(S_1) \land x \in P(S_2)\}$,表示为所有的公共子序列
- 集合$A$中的最长的元素,设为$c$
- $f(S_1,S_2)=length(c)$

上面是对问题的数学描述

- 用数字$i$,表示$S_1$前$i$个元素序列
- 同理,用数字$j$,表示$S_2$前$j$个元素序列，则$f(S_1,S_2)=f(i,j)$
- 设$Q(i,j)$为$S_1$前$i$个元素和$S_2$前$j$个元素的所有的最长公共子序列的集合

考虑$c$的末尾字符为$l$不可能由谁产生


1. $c \in Q(i-1,j)$,$l$不可能是$a_i$

$$
\begin{aligned}
&\boxed{ \cdots \; \cdots } \;\;\; \xcancel a_i \\
&\boxed{ \cdots \; \cdots b_j } \\
\end{aligned}
$$

也就是说$c$由方框内的字符产生,那么此时$f(i,j) = f(i-1,j)$

2. $c \in Q(i,j-1)$,$l$不可能是$b_j$


$$
\begin{aligned}
&\boxed{ \cdots \; \cdots  a_i } \\
&\boxed{ \cdots \; \cdots } \;\;\; \xcancel b_j \\
\end{aligned}
$$

也就是说$c$由方框内的字符产生,那么此时$f(i,j) = f(i,j-1)$


3. $a_i$一定在$c$中,那么$a_i$一定是$c$的结尾,也就是$l$,关键$a_i$与$b$中的哪个元素配对呢?显然$b_1,b_2,\cdots,b_j$都有可能.那么我们设配对的元素为$b_k$,可以得到

$$
f(i,j)  = f(i-1,k-1) + 1, a_i == b_k \land  1 \leqslant k \leqslant j
$$

4. 同理,如果$b_j$一定参与了$c$,也可以得到

$$
f(i,j)  = f(k-1,j-1) + 1, a_k == b_j \land  1 \leqslant k \leqslant i
$$


综上得到状态转移方程


$$
f(i,j) = max \left\{
    \begin{aligned}
    & f(i-1,j) \\
    & f(i,j-1) \\
    & f(i-1,k-1) + 1 , a_i == b_k \land 1 \leqslant k \leqslant j \\
    & f(k-1,j-1) + 1 , a_k == b_j \land 1 \leqslant k \leqslant i \\
    \end{aligned}
\right.
$$

显然边界条件为

$$
f(i,j) = 0 , i == 0 \lor j == 0
$$

写出一个$O(n^3)$代码为

```cpp
<%- include("./lcs1.cpp")%>
```



## 优化方程


为什么我们的代码为$n^3$,因为多了一个$k$


可以想到$f(i-1,1),f(i-1,2),\cdots,f(i-1,j-1)$ 这些**问题对应的集合**$Q(i-1,1),Q(i-1,2),\cdots,Q(i-1,j-1)$都是$Q(i-1,j-1)$的子集,也就是求$f(i-1,j-1) + 1 ,a_i == b_j$

$f(1,j-1),f(2,j-1),\cdots,f(i-1,j-1)$同理.

同样又想到$f(i-1,j-1)$是$f(i-1,j),f(i,j-1)$对应集合的子集.


综合所得,一个新的状态转移方程.

$$
\begin{aligned}
&\boxed{ \cdots \; \cdots } \;\;\; a_i  \\
&\boxed{ \cdots \; \cdots } \;\;\; b_j \\
\end{aligned}
$$

也就是说$c-l$由方框内的字符产生


又显然,当$i=0 \lor j =0$时,表示$S_1$或$S_2$的长度为$0$时,$f(i,j) = 0$

综上所述,得到$(a)$式


$$
f(i,j) = \left\{
\begin{array}{cr}
f(i-1,j) & \\
f(i,j-1) &  \\
f(i-1,j-1)+1 & a_i = b_j \\
0 & i = 0 \lor j=0
\end{array}
\right. \tag a
$$



得到$O(n^2)$代码

```cpp
<%- include("./lcs3.cpp") %>
```

## 进一步证明

证明当$a_i = b_j$时, $f(i-1,j-1) + 1 \geqslant max(f(i-1,j),f(i,j-1))$恒成立,也就是说,当$S_1,S_2$的最后两个字符相等时，$f(i-1,j-1)+1$一定大于等于$f(i-1,j)$或$f(i,j-1)$.

已知:

1. $Q(i-1,j-1)=c$,也就是说$c$是前$i-1,j-1$个元素形成的最长公共子序列
2. $a_i = b_j$,$S_1,S_2$的最后两个元素相等

分情况讨论$f(i,j-1)$与$f(i-1,j-1)+1$的大小关系


$$
\begin{aligned}
&\boxed{ \cdots \; \cdots  a_i } \\
&\boxed{ \cdots \; \cdots } \;\;\; \xcancel b_j \\
\end{aligned}
$$


情况1:$a_i$不是$Q(i,j-1)$的中元素

容易想到,此时,$f(i,j-1) = f(i-1,j-1) = len(c) < f(i-1,j-1)+1$

情况2:$a_i$是$Q(i,j-1)$的中元素,则$a_i$必然与某个一个元素$b_k$配对,$1 \leqslant k \leqslant j-1$

$$
\begin{aligned}
&\boxed{ \cdots \; \cdots} \;  a_i  \\
&\boxed{ \cdots } \; b_k \cdots  \;\;\; \xcancel b_j \\
\end{aligned}
$$

此时:

$$
f(i,j-1) = f(i-1,k-1) + 1
$$

考虑$f(i-1,k-1)$与$f(i-1,j-1)$的大小关系,因为$P(i-1,k-1) \subseteq P(i-1,k-1)$,显然$f(i-1,k-1) \leqslant f(i-1,j-1)$

证明完毕.

## 最终代码 

此代码可以输出$lcs$答案对应的最长公共子序列

```cpp
<%- include("./lcs4.cpp")%>
```


::: colorfulbox

核心思想:

1. **每一个问题都对应一个集合**
2. 分类讨论,分解集合
3. 子集包含,问题转化

:::

## 题目练习

<%- include("./practice.md")%>
