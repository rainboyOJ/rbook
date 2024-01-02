## 问题

<%- include("./problem.md")%>

## 解析1: 暴力

本问题是:**在一个单调序列上查找$x$或$x$的后缀(当$x$不存在时)**

显示对于每个询问,最简单的方法就是使用暴力查询,代码如下

```cpp
<%- include("./force.cpp")%>
```

上面的代码的时间复杂度为$O(n^2)$,显然会超时.

## 解析2: 二分法

面对样例$1,2,5,9,100$,这个序列是有序的

我们可以利用**元素有序**这条性质来加快我们的查询呢?

一个朴素的想法如下

面对样例,我们查询的位置的范围是$[1,6]$,为什么最后一个位置是$6$,不应该是$5$吗?因为我们有可能会查询到比最大值$100$还要大的元素,例如,$200$,那这个时候,我们应该返回的位置是$6$,$100$位置的后面一个位置.

同样,我们可以这样思考,我们把原序列末尾添加一个无穷大的值,改成
$$
\begin{array}{lcccccc}
\text{元素}& 1&2&5&9&100&\infin  \\
\hline
\text{位置}& \tt{1}&\tt2&\tt3&\tt4&\tt5&\tt6
\end{array}
$$

那么如果出现比最大的一个元素还大的查询,返回的位置就是$n+1$,同样如果得到返回值为$n+1$则知道,没有查询到需要的值,输出`not found`


如果需要查询的元素是$6$,
可以描述我们的问题为:$f(1,6,6)$,表示在区间$[1,6]$上找到第一个$\geqslant 6$位置,我们挑选到中间位置$(1+6) / 2 = 3$,值为$5$,又发则元素$5 \leqslant 6$,所以$5$和左边的元素都是比$6$小,所以范围$[1,3]$是对我们无用的范围,那么新的问就变成了:$f(4,6,6)$,在区间$[4,6]$上查询第一个$\geqslant 6$的位置

- 我们成功的将问题缩小了一半,将问题变得到更简单了
- 新的问题与原问题是相似的,这显然是**递归**
- 小朋友法:如果找到足够多的小朋友来帮我们解题,一定可以解出来.所以问题有解.

<!-- TODO: 带学生使用小学生法解一遍题目 -->

下面采用更抽象的方法,来思考问题,设问题为$f(l,r,val)$,表示在区间$[l,r]$上第一个$\geqslant val$的位置 .条件:保证区间$[l,r]$上必然存在一个值$\geqslant val$

则得到公式如下

$$
f(l,r,val) =  
\begin{cases}
f(l,mid,val) ,& a[mid]  >= val\\
f(mid+1,r,val) ,& a[mid] < val
\end{cases} \tag1
$$

其中$mid = \lfloor(l+r) \div 2\rfloor$,且显然$f(l,l,val) = l$

于是我们写出如下代码:

```cpp
<%- include("./bs1.cpp") %>
```

## 二分查找的正确性证明

<%- include("./proof.md")%>

## 一般化

具体什么样的情况下可以使用二分查询算法呢?


在一个序列$A = a_1,a_2,\cdots,a_n$上,有一个函数叫做$check(a_i)$,针对序列$A$形成的新的序列$B = b_1,b_2,\cdots,b_n$,其中$b_i = check(a_i) \in \{true,false\}$


序列

$$
\color{blue}{ \underbrace{b_1,b_2,b_3,\cdots,b_m}_{check = false}},

\color{red}{
\underbrace{b_{m+1},\cdots,b_n}_{check = true}
}
$$

得到一个类似的如下的图: 

![](./1.svg)

若序列
存在某个位置

什么是单调性?

单调性的性质:

在一个单调性的序列上

1. 查询使函数$check(pos)$第一个成立的位置
1. 查询使函数$check(pos)$最后一个失败的后一个的位置

可以使用二分查询法

## 什么题目使用 

1. 第一个$\geqslant x$元素的位置
1. 第一个$= x$元素的位置
1. 最后一个$\leqslant x$元素的位置
1. 求解数字$x$的数量
1. 求解满足数字$val \in [l,r]$的数量


## 经典模型

- 最小值最大,最大值最小问题
    - 1.序列划分

## 练习题目

- luogu P1419
- luogu P1083
- luogu P2678
- luogu P1314
- luogu P1868
- luogu P1493
- hdu 6231
- poj 3273
- poj 3258
- poj 1905
- poj 3122
