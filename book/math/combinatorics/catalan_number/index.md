

1. 得到一个2对括号的所有可能的排列,使用c++wade


```
0:  ( ( ) )  ✅
0:  ( ) ( )  ✅
0:  ( ) ) (  ❌
0:  ) ( ( )  ❌
0:  ) ( ) (  ❌
0:  ) ) ( (  ❌
```


正确的数量为:$C(2n,n) - C(2n,n+1) = 6-4 = 2$

有$n$对括号,则共有$C(2n,n)$种排列,这个容易理解

怎么理解$C(2n,n+1)$ 表示是所有的不正确的排列?

集合$A$所有的不合法的排列

集合$B$是由$n+1$个l,$n-1$个r组成的所有的排列,共有$C(2n,n+1)$个


证明$f:A \to B$ 是一个双射函数

- 证明是单射的
不存在$a_1 \neq a_2 \land f(a_1) = f(a_2)$
- 证明是满射的,
不存在$b \in B \land b \notin ranf$

应该是用其它方法证明的,不应该用单射,满射
  
$ranf(f) = B$

## 公式


根据,P279页,得到,$catalan$公式如下


根据凸三角形状
$$
\left\{
\begin{aligned}
    &h(n) = h(1)\cdot h(n-1) + h(2)\cdot h(n-2) + \cdots + h(n-1) \cdot h(1) = \sum_{i=1}^{n-1} h(i) \cdot h(n-i) \\
    &h(1) = 1
\end{aligned}
\right. \tag 1
$$



$$
h(n) = \frac{4n-2}{n+1} \cdot h(n-1) \tag 2
$$

$$
h(n) = C(2n,n) - C(2n,n+1) \tag 3
$$

$$
h(n) = \frac{1}{n+1} \cdot C(2n,n) \tag 4
$$

## 题目

- P1044 栈
- hdu1134 Game of Connections（此题用到高精度大数）


## 参考

- [组合排序题目汇总(排列组合、卡特兰数和递归思想)_abcdefg七人站队,要求a必须在b-CSDN博客](https://blog.csdn.net/gaoyueace/article/details/90437368)
- [【组合数学基础9】Catalan数（卡特兰数）竞赛组合模块 联赛  强基_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV14P411T7TZ/)
