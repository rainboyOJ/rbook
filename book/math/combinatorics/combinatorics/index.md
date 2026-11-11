---
title: 排列与组合
rbook:
  history: history.md
  teach_plan: teach_plan.md
---

[[TOC]]

> 排列与组合的计数是基本的计数问题,根据从集合中选择元素的有序与无序,是否允许重复等限制条件,可以将这个问题划分成4个子类型
> 1. 集合的排列
> 2. 集合的组合
> 3. 多重集的排列
> 4. 多重集的组合


需要的前置的知识

- 集合
- 计数原理

## 集合的排列

设$S$为$n$元集,即$S=\{1,2,3,\cdots,n\}$

- **排列** : 从集合$S$中**有序**的取$r$个元素,称为$S$的一个$r$`排列`,记作$A_{n}^r$或$P(n,r)$
  - 有序的取,表示顺序不同,结果不同
- **全排列** : 当$r=n$时

$$
A_n^r = \left\{ 

\begin{array}{cc}
\frac{n!}{(n-r)!} & \text{if } r \leqslant n\\
0 & \text{if } r > n 
\end{array}
\right. \tag 1
$$

注:$0! = 1$


有的3个小朋友,分别叫作$1,2,3$,排成一队,有多少种可能性?

**答:** 有$\frac{3!}{(3-3)!} = 3! = 6$种可能性

$$
\begin{array}{l|ccc}
\text{编号}& \text{位置1} & \text{位置2} & \text{位置3} & \\
\hline \\
\blue{\frak{1}} & 1& 2 & 3 \\
\blue{\frak{2}} & 1 & 3 & 2 \\
\blue{\frak{3}} & 2 & 1 & 3 \\
\blue{\frak{4}} & 2 & 1 & 3 \\
\blue{\frak{5}} & 3 & 1 & 2 \\
\blue{\frak{6}} & 3 & 2 & 1 \\
\end{array}
$$

有的3个小朋友,分别叫作$1,2,3$,从中选取两个人,排成一队,有多少种可能性?

**答:** 有$\frac{3!}{(3-2)!} = 3! = 6$种可能性


$$
\begin{array}{l|cc}
\text{编号}& \text{位置1} & \text{位置2} \\
\hline \\
\blue{\frak{1}} & 1& 2  \\
\blue{\frak{2}} & 1 & 3 \\
\blue{\frak{3}} & 2 & 1 \\
\blue{\frak{4}} & 2 & 1 \\
\blue{\frak{5}} & 3 & 1 \\
\blue{\frak{6}} & 3 & 2 \\
\end{array}
$$



开始证明$\cal{Proof}:$

使用数学归纳法

当$r=1$时,显然有$n$可能性,符合公式$A_n^1 = n$

当$r=2,n > r$时,得到排序的数量等同于:

- 操作$\circledR$:先任取一个数$a_i$,然后在集合$S' = S - {a_i}$里再取一个数,得到的数量.
  
操作$\circledR$得到的数量可以这样计算:

- 第一次数的为$a_1$,得到$S' = S-{a_1}$,则先取$a_1$的情况下的取法数为$A_{n-1}^1 = n-1$,记为$f(S,a_1)$
- 第一次数的为$a_2$,得到$S' = S-{a_2}$,则先取$a_2$的情况下的取法数为$A_{n-1}^1 = n-1$,记为$f(S,a_2)$
- $\cdots$
- 第一次数的为$a_n$,得到$S' = S-{a_n}$,则先取$a_n$的情况下的取法数为$A_{n-1}^1 = n-1$,记为$f(S,a_n)$

根据**分类加法计数原理**,取两个数的情况,即$r=2$下,

$$
\sum_{i=1}^n f(S,a_i) = n\times (n-1) = \frac{n!}{(n-2)!} =A_n^2
$$
满足$(1)$式

当$r=x,x \leqslant n$,可以先有序的取前面$x-1$元素,然后剩余的元素的集合$|S'| = n-x+1$,问题就变成求取一个$1$元素的子问题,同样根据**分步加法原计数原理**

$$
A_n^{x-1} \times A_{n-x+1}^1 = \frac{n!}{(n-x+1)!} \times \frac{n-x+1}{1} = \frac{n!}{(n-x)!} = A_n^x
$$

证明完毕$\cal{Q.E.D}$

这里证明的核心思想其实就是**分解子问题**,也就是递归常用的思想.其实递归的分解子问题用到的就是**不重不漏的分解集合**这个思想.


## 集合的组合

设$S$为$n$元集,即$S=\{1,2,3,\cdots,n\}$

- **组合** : 从集合$S$中**无序**的取$r$个元素,称为$S$的一个$r$`组合`,$S$的不同$r$组合数记作$C_{n}^r$或$C(n,r)$
  - 无序的取,表示不考虑顺序,例如$1,2$与$2,1$是同一种`组合`
- **全排列** : 当$r=n$时

$$
C_n^r = \left\{ 

\begin{array}{cc}
\frac{A_n^r}{r!} = \frac{n!}{r!(n-r)!} & \text{if } r \leqslant n\\
0 & \text{if } r > n 
\end{array}
\right. \tag 2
$$


有的3个小朋友,分别叫作$1,2,3$,选取两个人支参数活动,有多少种可能性?

**答:** 有$C_3^2 = \frac{3!}{2!1!} = 3$种可能性

$$
\begin{array}{l|cc}
\text{编号}& \text{选取1} & \text{选取2}\\
\hline \\
\blue{\frak{1}} & 1& 2  \\
\blue{\frak{2}} & 1 & 3 \\
\blue{\frak{3}} & 2 & 3 \\
\end{array}
$$

开始证明$\cal{Proof}:$

采用集合映射的思想.从集合$S$中取出$r$元素,这个$r$元素进行全排列,显然有$r!$种可能性,即这$r!$种排列映射到一个组合,所以

$$
C_n^r = \frac{A_n^r}{r!} = \frac{n!}{r!(n-r)!}
$$


证明完毕$\cal{Q.E.D}$

## 组合恒等式

$$
C(n,r) = \frac{n}{r}C(n-1,r-1) \tag 3
$$

开始证明$\cal{Proof}:$

使用代数法证明,根据公式

$$
C(n,r)= \frac{n!}{r!(n-r)!} = \frac{n}{r} \cdot \frac{(n-1)!}{(r-1)!((n-1)-(r-1))!} = \frac{n}{r}C(n-1,r-1)
$$

证明完毕$\cal{Q.E.D}$

$$
C(n,r) = C(n,n-r) \tag 4
$$

开始证明$\cal{Proof}:$

使用集合的一一映射的思想,从集合$S={1,2,\cdots,n}$中取中$r$元素后形成了一个组合,那么集合$S$就会剩余$n-r$个元素,形成新的组合,也就是说那每一个$S$的$r$组合都有一个$S$的$n-r$组合与之对应,因此$S$的$r$组合数与$S$的$n-r$的组合数相等.

证明完毕$\cal{Q.E.D}$

$$
C(n,r) = C(n-1,r-1) + C(n-1,r) \tag 5
$$

开始证明$\cal{Proof}:$

将集合$S=\{1,2,3,\cdots,n\}$形成的$r$的组合分成两类,

- $S_1$,包含$1$的$r$组合
- $S_2$,不包含$1$的$r$组合

显然对于$S_1$,因为包含$1$,则会剩下的$r-1$个元素只能从$\{2,3,\cdots,n\}$中取,因此有$C(n-1,r-1)$种方法

对于$S_1$,因为不包含$1$,所有的$r$个元素只能从$\{2,3,\cdots,n\}$中取,因此有$C(n-1,r)$种方法

根据**分类加法计数原理**:$C(n,r) = C(n-1,r-1)+C(n,r-1)$.
这显然用到了**分解子问题**的思想

证明完毕$\cal{Q.E.D}$

$$
\sum_{i=0}^{i=n}C(n,i) = 2^n \tag 6
$$

开始证明$\cal{Proof}:$

使用化归法,转成成其它问题,从$\{1,2,\cdots,n\}$中选取任意$i$个元素,$0\leqslant i \leqslant n$,等价于长为$n$位的二进制,如果第$x$位为$0$
就表示第$x$个元素没有选取,如果第$x$位为$1$就表示第$x$个元素被选取.

每个位置有选和不选,即$0,1$两种可能性,则共有$2^n$种可能性

证明完毕$\cal{Q.E.D}$

$$
\sum_{i=0}^{i=n}(-1)^iC(n,i) = 0 \tag 7
$$

开始证明$\cal{Proof}:$

根据二项式定理（生成函数视角）：

$$
(1+x)^n = C(n,0)x^0 + C(n,1)x^1 + \cdots + C(n,n)x^n
$$

将 $x=-1$ 代入，左侧为 $(1-1)^n = 0$，右侧即为该交错和。

证明完毕$\cal{Q.E.D}$

---

## 多重集的排列

设多重集 $S$ 由 $k$ 种不同类型的元素组成，每种元素的重复度（重数）分别为 $n_1, n_2, \dots, n_k$，总元素个数为：
$$n = n_1 + n_2 + \dots + n_k$$
常记为 $S = \{n_1 \cdot a_1, n_2 \cdot a_2, \dots, n_k \cdot a_k\}$。

- **多重集全排列**：将多重集 $S$ 中的所有 $n$ 个元素排成一列的不同排列方式总数，记作 $P(n; n_1, n_2, \dots, n_k)$。

$$
P(n; n_1, n_2, \dots, n_k) = \frac{n!}{n_1! \, n_2! \dots n_k!} \tag{8}
$$

### 证明方法一：除法原理（视同相异再消序）

$\cal{Proof}:$
假设我们将所有相同的元素全部标上不同的下标，看作彼此互不相同的独立个体：
- $a_1$ 的 $n_1$ 个副本标记为 $a_{1,1}, a_{1,2}, \dots, a_{1,n_1}$；
- $a_2$ 的 $n_2$ 个副本标记为 $a_{2,1}, a_{2,2}, \dots, a_{2,n_2}$；
- ……以此类推。

此时总共有 $n$ 个互不相同的元素，它们的全排列数量为 $n!$。

然而，对于任何一种实际的多重集排列：
- 第 1 类元素的 $n_1$ 个位置在抹去下标后完全相同，这 $n_1$ 个元素内部的任意排列（共有 $n_1!$ 种）对应同一种多重集排列；
- 同理，第 2 类的 $n_2$ 个副本有 $n_2!$ 种置换……直到第 $k$ 类有 $n_k!$ 种置换。

由乘法原理，标上下标后的每一种多重集排列都被重复计算了 $n_1! \times n_2! \times \dots \times n_k!$ 次。根据**除法原理（映射压缩）**：
$$
P(n; n_1, n_2, \dots, n_k) = \frac{n!}{n_1! \, n_2! \dots n_k!}
$$
证明完毕$\cal{Q.E.D}$

### 证明方法二：位置占位法（分步组合）

$\cal{Proof}:$
排成一列相当于在 $n$ 个空白位置中依次为各类元素挑坑位：
- 首先在 $n$ 个空位中任选 $n_1$ 个位置安放第一类元素 $a_1$，方案数为 $\binom{n}{n_1}$；
- 剩下的 $n - n_1$ 个空位中任选 $n_2$ 个位置安放第二类元素 $a_2$，方案数为 $\binom{n - n_1}{n_2}$；
- ……
- 依次类推，直到在最后的 $n_k$ 个空位中安放第 $k$ 类元素 $a_k$，方案数为 $\binom{n_k}{n_k} = 1$。

根据分步乘法计数原理，总排列数为：
$$
\begin{aligned}
P &= \binom{n}{n_1} \binom{n - n_1}{n_2} \dots \binom{n_k}{n_k} \\
&= \frac{n!}{n_1! (n - n_1)!} \cdot \frac{(n - n_1)!}{n_2! (n - n_1 - n_2)!} \dots \frac{n_k!}{n_k! \, 0!}
\end{aligned}
$$
中间所有形如 $(n - n_1 - \dots)!$ 的项首尾全部对消，最终分子仅剩 $n!$，分母为各个 $n_i!$ 的乘积：
$$
P(n; n_1, n_2, \dots, n_k) = \frac{n!}{\prod_{i=1}^k n_i!}
$$
证明完毕$\cal{Q.E.D}$

**例题**：由单词 `MISSISSIPPI` 的所有字母可以组成多少个不同的排列？  
该多重集包含：$1$ 个 M，$4$ 个 I，$4$ 个 S，$2$ 个 P，总字母数 $n = 11$。  
由公式可得排列总数为：
$$
\frac{11!}{1! \times 4! \times 4! \times 2!} = \frac{39916800}{1 \times 24 \times 24 \times 2} = 34650
$$

---

## 多重集的组合（可重组合 / 隔板法）

设集合包含 $n$ 种不同类型的元素，每种元素的数量均充裕（或者允许有放回地选取）。
从这 $n$ 种元素中**无序地**选出 $r$ 个元素构成一个多重集，称为从 $n$ 种元素中取 $r$ 个元素的**可重组合**，其方案数记作 $\left(\!\binom{n}{r}\!\right)$ 或 $H_n^r$。

$$
H_n^r = \binom{n + r - 1}{r} = \binom{n + r - 1}{n - 1} \tag{9}
$$

### 证明方法一：隔板法（球与盒模型）

$\cal{Proof}:$
设从第 $i$ 种元素中选出了 $x_i$ 个，则确定一个可重组合完全等价于求下列不定方程的**非负整数解**的组数：
$$
x_1 + x_2 + \dots + x_n = r \quad (x_i \in \mathbb{N}, \; x_i \geqslant 0)
$$
为了利用经典的隔板法（插空），我们需要将非负整数解转换为正整数解。  
令 $y_i = x_i + 1$，因为 $x_i \geqslant 0$，所以 $y_i \geqslant 1$ 为正整数。原方程变形为：
$$
(y_1 - 1) + (y_2 - 1) + \dots + (y_n - 1) = r
$$
即：
$$
y_1 + y_2 + \dots + y_n = r + n \quad (y_i \geqslant 1)
$$
几何意义：将 $r + n$ 个相同的小球排成一排，它们之间形成了 $(r + n) - 1 = n + r - 1$ 个可用间隙。要将这排球切分成 $n$ 个非空的段（每段至少 1 个球），只需在这些间隙中任选 $n - 1$ 个位置插入隔板。

因此，不同的分配方案数为：
$$
\binom{n + r - 1}{n - 1} = \binom{n + r - 1}{r}
$$
证明完毕$\cal{Q.E.D}$

### 证明方法二：差分平移技巧（严格单调双射）

在算法竞赛中，可重组合常常以“求非降序列的数量”这一形式出现。这个证明给出了一个极度纯粹且强大的代数双射。

$\cal{Proof}:$
假设从 $1, 2, \dots, n$ 这 $n$ 个数中允许重复地选出 $r$ 个数。由于组合不计顺序，我们总可以将选出的这 $r$ 个数从小到大排成一个**单调非降序列**：
$$
1 \leqslant c_1 \leqslant c_2 \leqslant \dots \leqslant c_r \leqslant n
$$
因为允许元素相等（$c_i \leqslant c_{i+1}$），这还不是我们熟悉的无重复组合。我们对每一项施加一个随着下标严格递增的偏移量，构造新序列 $d$：
$$
d_k = c_k + k - 1 \quad (1 \leqslant k \leqslant r)
$$
考察 $d$ 序列的严格单调性与值域范围：
1. **严格单调递增**：因为 $c_{k+1} \geqslant c_k$，所以：
   $$d_{k+1} - d_k = (c_{k+1} + k) - (c_k + k - 1) = (c_{k+1} - c_k) + 1 \geqslant 0 + 1 = 1 > 0$$
   即恒有 $d_k < d_{k+1}$；
2. **值域边界**：
   - 最小值：$d_1 = c_1 + 1 - 1 = c_1 \geqslant 1$；
   - 最大值：$d_r = c_r + r - 1 \leqslant n + r - 1$。

这说明：
任意一个满足 $1 \leqslant c_1 \leqslant c_2 \dots \leqslant c_r \leqslant n$ 的**弱单调非降序列**，与一个在集合 $\{1, 2, \dots, n + r - 1\}$ 中选出的**互不相同的严格递增序列** $1 \leqslant d_1 < d_2 \dots < d_r \leqslant n + r - 1$ 构成了**一一对应的双射（Bijection）**！

而在大小为 $n + r - 1$ 的集合中无重复地挑选 $r$ 个元素，方案数正是普通组合数：
$$
\binom{n + r - 1}{r}
$$
证明完毕$\cal{Q.E.D}$

---

## 经典实战典例：Codeforces 1288C Two Arrays

### 问题模型
给定正整数 $n$ 与 $m$。求满足下列条件的数组对 $(a, b)$ 的数量模 $10^9 + 7$：
- 数组长度均为 $m$；元素值域均为 $[1, n]$；
- $a$ 是非降序列：$a_1 \leqslant a_2 \leqslant \dots \leqslant a_m$；
- $b$ 是非增序列：$b_1 \geqslant b_2 \geqslant \dots \geqslant b_m$；
- 逐位满足：$\forall k \in [1, m], \; a_k \leqslant b_k$。

### 思维跃迁与秒杀

1. **偏序传递性解耦**：
   由单调性，$a_k \leqslant a_m$ 且 $b_m \leqslant b_k$。因此只要在末尾处满足 $a_m \leqslant b_m$，对于任意位置 $k$ 均有：
   $$a_k \leqslant a_m \leqslant b_m \leqslant b_k$$
   中间所有位置的偏序约束天然自动全部成立！
2. **逆序对称拼接**：
   将非增序列 $b$ 倒序书写：$b_m \leqslant b_{m-1} \dots \leqslant b_1$。  
   将序列 $a$ 与倒序的 $b$ 首尾拼接，构成长度为 $2m$ 的大数组 $c$：
   $$c = [a_1, a_2, \dots, a_m, \; b_m, b_{m-1}, \dots, b_1]$$
   该数组满足极其优美的全局单调性：
   $$1 \leqslant a_1 \leqslant a_2 \dots \leqslant a_m \leqslant b_m \leqslant b_{m-1} \dots \leqslant b_1 \leqslant n$$
3. **套用可重组合公式**：
   原问题瞬间等价于：**从值域 $[1, n]$ 中允许重复地选出 $2m$ 个非降整数！**  
   直接套用多重集组合（差分平移）公式，其中元素种类为 $n$，选取个数 $r = 2m$：
   $$\text{Ans} = \binom{n + 2m - 1}{2m} \pmod{10^9 + 7}$$

无需任何动态规划，一行组合数直接在 $O(m)$ 时间内算出最终解。

---

## 圆排列

从 $n$ 个不同元素中选出 $r$ 个元素排成一个圆环，如果两种排列可以通过沿圆周旋转完全重合，则视为同一种圆排列。其排列数记为 $Q_n^r$。

对于任何一种包含 $r$ 个元素的圆排列，沿圆周共有 $r$ 种不同的旋转断开位置，每种断开方式对应一种线排列。因此由除法原理：
$$
Q_n^r = \frac{A_n^r}{r} = \frac{n!}{r (n - r)!}
$$
当 $r = n$ 时，全圆排列数为：
$$
Q_n^n = \frac{n!}{n} = (n - 1)!
$$

---

## 总结：四类排列组合对照矩阵

| 选取方式 | 有序（排列） | 无序（组合） |
| :--- | :--- | :--- |
| **无重复（集合）** | $A_n^r = \frac{n!}{(n-r)!}$ | $C_n^r = \binom{n}{r} = \frac{n!}{r!(n-r)!}$ |
| **有重复（多重集）** | 全排列：$\frac{n!}{n_1! n_2! \dots n_k!}$ | 可重组合：$\binom{n + r - 1}{r}$（隔板法 / 差分平移） |

---

## 代码模板：组合数取模计算

在算法竞赛中，当 $n$ 较大且模数 $MOD = 10^9 + 7$ 为质数时，通常使用费马小定理结合乘法逆元在 $O(r \log MOD)$ 或阶乘预处理 $O(n)$ 下快速求解组合数：

```cpp
#include <iostream>
using namespace std;

const int MOD = 1e9 + 7;

// 快速幂求逆元: a^(MOD-2) mod MOD
long long qpow(long long a, long long b) {
    long long res = 1;
    while (b) {
        if (b & 1) res = res * a % MOD;
        a = a * a % MOD;
        b >>= 1;
    }
    return res;
}

// 快速计算组合数 C(n, k)
long long C(int n, int k) {
    if (k < 0 || k > n) return 0;
    long long num = 1, den = 1;
    for (int i = 1; i <= k; ++i) {
        num = num * (n - i + 1) % MOD;
        den = den * i % MOD;
    }
    return num * qpow(den, MOD - 2) % MOD;
}

// 计算多重集可重组合 H(n, r) = C(n + r - 1, r)
long long H(int n, int r) {
    return C(n + r - 1, r);
}
```

---

## 参考

- [Combinatorics - Wikipedia](https://en.wikipedia.org/wiki/Combinatorics)
- [Stars and bars (combinatorics) - Wikipedia](https://en.wikipedia.org/wiki/Stars_and_bars_(combinatorics))
- 《离散数学（第2版）》 屈婉玲、耿素云、张立昂. [M]. :P237-P243.