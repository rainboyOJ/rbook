[[TOC]]

## 教学目标

本题较难,按下面的步骤来解题

1. 列数据,找规律
1. 如何描述问题(把思想转换成语言)
2. 理解如何分解子问题
3. 写出数据描述的式子
4. 根据式子写代码

## 整数划分

### 问题描述

对于一个正整数$n$的分解，就是把$n$表示成一系列正整数之和的表达式。注意，分解与顺序无关，例如$6=5+1$和$6=1+5$是一样的。N本身也是一个划分。
例如：对于$n=6$

```
6
5+1
4+2     4+1+1
3+3     3+2+1       3+1+1+1
2+2+2   2+2+1+1     2+1+1+1+1
1+1+1+1+1+1
```
求分化的数目$p(n)$，显然$p(6) = 11$

### 解析

不知道如何下手，把所有的数据都写一下，找一下规律，找规律是一种很常用的方法。


对于1

```
1
```

对于2

```
2
1+1
```

对于3

```
3
2+1
1+1+1
```

对于4

```
4
3+1
2+2 2+1+1
1+1+1+1
```

对于5

```
5
4+1
3+2 3+1+1
2+2+1 2+1+1+1
1+1+1+1+1
```

对于6

``#include <cstdio>

int n;
int dfs(int n,int m){
    if( m > n ) m = n;
    if( m == 1) return 1;
    int ans = 0;
    if( m == n) ans=1,m=n-1;
    for(int i = m ; i>=1;i--){
        int d = dfs(n-i,i);
        ans +=d;
    }
    return ans;
}
int main(){
    //输入数字
    cout >> n;
    int ans = dfs(n,n);
    cout << ans;
    return 0;
}`
6
5+1
4+2     4+1+1
3+3     3+2+1       3+2+1+1
2+2+2   2+2+1+1     2+1+1+1+1
1+1+1+1+1+1
```

对于7

```
7
6+1
5+2 5+1+1
4+3 4+2+1 4+1+1+1
3+3+1 3+2+2 3+2+1+1 3+1+1+1+1
2+2+2+1 2+2+1+1+1 2+1+1+1+1+1
1+1+1+1+1+1+1+1
```


通过对上面的数据的观察， 设$f(n,m)$表示把$n$分解成不超过$m$的分法的数量，可以得到下面的规律。


显然$f(n,1)= 1$

 - $f(n,n) = 1+f(n-1,1) + f(n-2,2)+ \cdots +f(1,n-1) = 1+\displaystyle\sum_{i=1}^{n-1} f(n-i,i)$
 - 当$m>n$时，$f(n,m) = f(n,n)$
 - 当$m<n$时，$f(n,m) = f(n-1,1)+ f(n-2,2) + \cdots + f(n-m,m) = \displaystyle\sum_{i=1}^{m} f(n-i,i)$

综上$3$个公式,得到

$$
f(n,m) =
\left\{
\begin{gather}
f(n,n) & m>n & \\
1+\displaystyle \sum_{i=1}^{n-1} f(n-i,i) & m = n \\
\displaystyle \sum_{i=1}^{m} f(n-i,i) & m < n \\
1 & m=1 
\end{gather}
\right. \tag a
$$

发现$(a)$式的$(3),(4)$式很像,思考简化后得到如下的公式$(b)$:

$$
f(n,m) =
\left\{
\begin{array}{c}
f(n,n) & m>n \\
\displaystyle \sum_{i=1}^{m} f(n-i,i) & m \leqslant n \\
1 & m=1 \lor n =0
\end{array}
\right. \tag b
$$

TODO: 验证



## 总结

核心在于**找规律**,找规律基本上是所有的题目的解法,这里的规律是分出来数,就是一个新的问题。

对于任何问题,都可以先从简单的形式开始思考,简单的问题一定是比复杂的形势更容易解决的。这处方法我称为:**缩小放大法**

### 代码

根据$(a)$式得到的代码

```cpp
<%- include("./code1.cpp")%>
```

根据$(b)$式得到的代码

```cpp
<%- include("./code2.cpp")%>
```