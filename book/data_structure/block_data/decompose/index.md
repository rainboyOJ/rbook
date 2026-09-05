
根据均值不等式，$A_n \geqslant G_n$

可以得到

$$
s+\frac{n}{s} = \frac{2s + 2\frac{n}{s}}{2} \leqslant \sqrt[2]{2s + 2\frac{n}{s}} = 2\sqrt[2]{n}
$$

显然当$s = sqrt[2]{n}$时成立，且取到最小值

## 例题

[6280. 数列分块入门 4 - 题目 - LibreOJ](https://loj.ac/p/6280)

::: fold

```cpp
<%- include("./code/loj6280.cpp") _%>
```
:::

## 参考

- https://oi-wiki.org/ds/decompose/
