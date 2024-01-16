题目

TODO


根据前面所学的集合的知识，设集合为$S = \{a_1,a_2,\cdots,a_n\}$,问题:在集合$S$上的$Lis$的值,表示为$f(S)$,

暴力想法

也就是集合$S$的所有子集$x$组合的集合$P(S) = \{x | x \subseteq S\}$,$P(S)$叫做集合$S$的幂集.

设$x \in P(S)$

$$
g(x) = \left\{
    \begin{aligned}
        &\vert x \vert & x 各个元素是符合Lis的\\
        &0 & \text{如果$x$是空集}\\
    \end{aligned}
\right. 
$$




根据集合分类的思想,考虑是后一个元素,要么包含最后一个元素$a_n$,要么不包含



那么问

$$
f(S) =
\left\{
    \begin{aligned}
        &f(S-\{a_n\}) &\text{不包含$a_n$}\\
        &g(S,a_n) & \text{包含$a_n$}
    \end{aligned}
\right.
$$

显然$f(S)$分解成了一子问题$g(S,a_n)$与原问题不相似,连参数都不一样,这不一种好的分解子问题的方式,或集合分类方式.但这启发了我们.

为了方法,我们用数字来表示集合,如$4$,就是表示前$4$个元素表示的集合$\{a_1,a_2,a_3,a_4\}$

显然,可以用$g(n,a_n)$来表示前$n$个元素组成的集合,且一定含有的$a_n$最为最后一个元素的$lis$的值

那么

$$
g(n,a_n) = max(\{g(i,a_i) \big\vert i \leqslant n \land a_i \leqslant a_n \}) +1
$$

$g(n,a_n)$的答案,就是符合条件的子集合组成的集合的最值加$1$,成功建立起和子集合之间的关联

$$
f(S) = max(\{g(i,a_i) \big\vert i \in [1,n]\})
$$

建立起了最终问题与$g$的关联.