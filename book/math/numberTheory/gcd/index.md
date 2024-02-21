[[TOC]]

## 问题引入

现有两个整数$r_0,r_1$,如何求两个整数的最大公约数,也就是$gcd(r_0,r_1)$?

## 朴素算法

## Euclid算法

在数学界，辗转相除法，又称欧几里得($Euclid$)算法，被认为是世界上最早的算法（公元前300年），该算法用于求两个最大公约数的算法。辗转相除法首次出现于欧几里得的《几何原本》（第VII卷，命题yⅠ和Ⅱ）中，而在中国则可以追溯至东汉出现的《九章算术》。

证明: 设$r_0 = q_1 \cdot r_1 + r_2$,其中$r_0,r_1,_r2,q_1 \in \mathbb{Z},0 \leqslant r_2 < | r_0 |$,则$gcd(r_0,r_1) = gcd(r_1,r_2)$,简写成$(r_0,r_1) = (r_1,r_2)$

我们的思路是证明$r_0,r_1$与$r_1,r_2$有相同的公因子.形式语言为

$$
\forall x ( x \mid r_0 \land x \mid r_1) \Leftrightarrow
\forall x ( x \mid r_1 \land x \mid r_2)
$$

设$G(x,y)$表示$x,y$公因子的形成的集合

$$
G(r_0,r_1) = G(r_1,r_2)
$$


$\mathcal{Proof}$

```math
\begin{aligned}
d \in G(r_0,r_1) &\Leftrightarrow d \mid r_0 \land d \mid r_1 \\
    &\Rightarrow d \mid x\cdot r_0 + y\cdot r_1 &\\
    &\Rightarrow d \mid r_2  &\text{前提引入: $r_2 = r_0 - q_1\cdot r_1$} \\
    &\Rightarrow d \mid r_2 \land d \mid r_1  &\text{合取引入: $d \mid r_1$} \\
    &\Leftrightarrow d \in G(r_1,r_2)  
\end{aligned}
```

同理:

```math
\begin{aligned}
d \in G(r_1,r_2) &\Leftrightarrow d \mid r_1 \land d \mid r_2 \\
    &\Rightarrow d \mid x\cdot r_1 + y\cdot r_2 &\\
    &\Rightarrow d \mid r_0  &\text{前提引入: $r_0 = q_1\cdot r_1 + r_2$} \\
    &\Rightarrow d \mid r_0 \land d \mid r_1  &\text{合取引入: $d \mid r_1$} \\
    &\Leftrightarrow d \in G(r_0,r_1)  
\end{aligned}
```

因为$gcd(x,y) = max(G(x,y))$,且$G(r_0,r_1) = G(r_1,r_2)$,显然$gcd(r_0,r_1) = gcd(r_1,r_2)$

$\mathcal{Q.E.D}$

那么根据上面的证明,我们得出一个重要的结论

$$
gcd(a,b) = gcd(b, a \; \% \; b) \;\;\%\text{表示取余运算}
$$

如何才能求出$gcd(x,y)$呢?以$gcd(44,12)$为例子

$$
\begin{aligned}
(44,12) &= (12,8) &44 = 3\times 12+8 \\
&=(8,4) & 12 = 8 + 4 \\
&=(4,0) & 8 = 2\times 4 \\
&= 4 & 4\mid 4 \land 4 \mid 0\\
\end{aligned}
$$

具体的

$$
(r_i,r_{i+1}) \xlongequal{ r_i = q_{i+1} \times r_{i+1} + r_{i+2}} (r_{i+1},r_{i+2})
$$

由于$r_1 > r_2 > r_3 > \cdots \leqslant 0$,必然存在一个$k$使得$r_{k+1}=0$,那时就求出了$gcd(r_0,r_1)$

```math
\begin{array}{c|c}
gcd & \text{带余除法} \\
\hline  \\
(r_0,r_1) & r_0 = q_1 \cdot r_1 + r_2 \\
(r_1,r_2) & r_1 = q_2 \cdot r_2 + r_ 3\\
\vdots & \vdots \\
(r_{k-1},r_{k}) &r_{k-1} = q_k \cdot r_k + 0\\
(r_{k},0) & 
    
\end{array}
```

## 练习

手动计算几个数学进行练习


## 模板

```cpp
<%- include("/algo_template/math/numberTheory/gcd.cpp")%>
```