> 排列与组合的计数是基本的计数问题,根据从集合中选择元素的有序与无序,是否允许重复等限制条件,可以将这个问题划分成4个子类型
> 1. 集合的排列
> 2. 集合的组合
> 3. 多重集的排列
> 4. 多重集的组合

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

- **组合** : 从集合$S$中**无序**的取$r$个元素,称为$S$的一个$r$`组合`,$S$的不同$r$`组合`数记作$C_{n}^r$或$C(n,r)$
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

根据生成函数的定义，

$$
(1+x)^n = C(n,0)x^0 + C(n,1)x^1 + \cdots + C(n,n)x^n
$$

将$x=-1$代入,得到结果$0$

证明完毕$\cal{Q.E.D}$
## 圆排列


## 参考

- [Combinatorics - Wikipedia](https://en.wikipedia.org/wiki/Combinatorics)
- [Combinatorial principles - Wikipedia](https://en.wikipedia.org/wiki/Combinatorial_principles)