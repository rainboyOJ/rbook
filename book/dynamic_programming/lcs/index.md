## 题目


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

考虑$c$的末尾字符为$l$


1. $c \in P(i-1,j)$

$$
\begin{aligned}
&\boxed{ \cdots \; \cdots } \;\;\; \xcancel a_i \\
&\boxed{ \cdots \; \cdots b_j } \\
\end{aligned}
$$

也就是说$c$由方框内的字符产生

2. $c \in P(i,j-1)$


$$
\begin{aligned}
&\boxed{ \cdots \; \cdots  a_i } \\
&\boxed{ \cdots \; \cdots } \;\;\; \xcancel b_j \\
\end{aligned}
$$

也就是说$c$由方框内的字符产生

3. 考虑$c$的末尾字符为$l$,也有可能$l = a_i = a_j$,也就是$c$的末尾就是$S_1$和$S_2$的末尾共同产生,且$a_i = b_j$,则$c-l$表示$c$去除末尾字符后产生的字符串


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



得到代码

```cpp
<%- include("./code1.cpp") %>
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


## 题目练习

<%- include("./practice.md")%>