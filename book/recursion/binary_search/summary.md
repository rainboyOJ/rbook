::: colorfulbox

定义1 二分性

在一个序列$A = a_1,a_2,\cdots,a_n$上,有一个函数叫做$check(a_i)$,针对序列$A$形成的新的序列$B = b_1,b_2,\cdots,b_n$,其中$b_i = check(a_i) \in \{true,false\}$,且序列$b$的相同值的位置都是连续的,如下所示:

$$
\color{blue}{ \underbrace{b_1,b_2,b_3,\cdots,b_m}_{check = false}},

\color{red}{
\underbrace{b_{m+1},\cdots,b_n}_{check = true}
}
$$

得到一个类似的如下的图:

![](./1.svg)

如果序列b满足两个条件

- 只有两个值
- 相同值的位置都是连续

则说明序列$A$在函数$check$是具有二分性.其中$b_m,b_{m+1}$称为分界点


:::



::: colorfulbox

推论1

具有二分性的序列可以使用**二分查找**算法来查找分界点的位置

:::

::: colorfulbox

推论2

对于序列$A$,若函数$f(a_i)$成立,则$f(a_j),j \geqslant i$都成立,则会序列$A$满足二分性.

:::

推论2证明:


