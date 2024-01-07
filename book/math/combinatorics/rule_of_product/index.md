
> **乘法原理**是组合计数的基本计数原理。简而言之，“若有$a$种方法做某事，$b$种方法做另一事，则合共有${a \cdot b}$种方法做此两件事。”

## 例子

有一个集合$A= \{a_1,a_2,a_3\}$,一个集合$B= \{b_1,b_2\}$,现从分别从集合$A,B$中取一个元素,形成一个新的集合$C$,问$C$有多少种可能性?

```plaintext
    ┌───► a1
    │
a ──┼───► a2
    │
    └───► a3

    ┌───► b1
b ──┤
    └───► b3
```

注意前提条件: 集合$A \cap B = \varnothing$
即两次选择中，没有选项重复出现

整个问题可以等同于选取一个有序对$(a,b)$,其中$a \in A,b \in B$,$a$有$3$种取法,$b$有$2$种取法,则共有$3 \times 2 = 6$


使用集合来描述这个种问题

$$
\left.
\begin{array} {c}
C = \{(a,b) \mid a \in A , b \in B \} \\ 
A \cap B = \varnothing \\
\end{array}
\right\}
\Rightarrow
|C| = |A| \times |B|
$$

## 练习题目

TODO

## 参考

- [Rule of product - Wikipedia](https://en.wikipedia.org/wiki/Rule_of_product)