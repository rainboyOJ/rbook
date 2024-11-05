## 说明

1. 人民教育出版社 A版: 数学选修 4-6 初等数论初步
1. 人民教育出版社 B版: 数学选修 4-6 初等数论初步
1. 离散数学(第2版) 初等数论部分
1. 基础数论典型题解300例
2. 初等数论第四版第4版闵嗣鹤严士健
3. 数论入门-从故事到理论 


## 第一讲 整数的整除

::: colorfulbox

整除的定义

设$a,b \in \mathbb{Z}$，若存在整数$k \neq 0$使得$a=bk$，则称$b$是$a$的**因子**，记作$b \mid a$,否则记做$b \nmid a$。

:::

性质

1. 互为因子则相等: $(a \mid b \land b \mid a) \to (a = b \lor a = -b)$.
2. 传递性: $(a \mid b \land b \mid c) \to a \mid c$
3. $a \mid b \land a \mid c \to a \mid (bx + cy) , x,y \in \mathbb{Z}$
4. 消去律: $ak \mid xk \to a \mid x$


证明


(1): $a \mid b \to \exists k_1 \neq 0: a = b k_1$. 同理 $b \mid a \to \exists k_2 \neq 0: b = a k_2$. 得到$b \cdot k_1 \cdot k_2 = b \to k_1 \cdot k_2 = 1 \to k_1 = k_2 = \pm 1$.于是$a = b \lor a  = -b$

(2): 根据前件得到:$a \cdot k_1 = b, b \cdot k_2 = c \to a \cdot k_1 \cdot k_2 = c$. 于是$a \mid c$

(3): 是这里最难证明的.

显然 $a \mid b \to a \mid k \cdot b$.再证明$a \mid b \land a \mid c \to a \mid (b+c)$.

$$
\begin{aligned}
a \mid b \land a \mid c & \to  (a \cdot k_1 = b \land a \cdot k_2 = c) \\
& \to a \cdot (k_1 + k_2) = b + c \\
& \to a \mid (b+c) \\
\end{aligned}
$$

又因为$a \mid bx , a \mid cy$ 成立,所以$a \mid (bx + cy)$成立.

(4). $ak \mid xk \to a \cdot k \cdot k_1 = x \cdot k \to a \cdot k_1 = x \to a \mid x$


### 1.2 带余除法

::: colorfulbox

带余除法

对于任意一对整数$a,b$,其中$b \neq 0$，**存在唯一一对整数$q,r$，使得

$$
a = bq + r, \quad 0 \leq r < |b|
$$

:::

这里没有证明.这里可以通过**枚举法**感性的理解它的正确性.


## 3. 素数判定


法1:判断单个数字是否为素数,时间为$\sqrt n$

```cpp
bool isPrime(int a) {
    for(int i = 2;i *i <= a;i++) {
        if( a % i == 0) return 0;
    }
    return 1;
}
```

如果从快速得到$[1,n]$之间的所有的素数呢?,如果对每一个数调用$isPrime(i)$,那时间为$n \times \sqrt n$.

还有一种更快的方法,叫做埃氏筛法.o

它的基本思想如下:

- 删除$[1,n]$之间的所有的合数.
- $[1,n]$之间的所有的素数一定不会被删除.

证明这个算法的正确性,集合不漏与数学归纳法.


对某个合数$a \geqslant 2$,它一定可以被不超过$\sqrt a$的素数整除.那么合数$a$被删除一定要保证$[2,\sqrt a]$之间的素数不被删除. 观察算法,发现只有一个数是两个数的乘积时才会被删除,显然素数都不会被删除.所以合数a一定被删除(不漏),所以算法的正确性是显然的.

```cpp
#include <bits/stdc++.h>
using namespace std;

const int maxn = 1e5+5;
bool del[maxn]; // 0 表示没有删除
vector<int> prime;

//埃式筛法
/* 原理: 
 *  - 2是最小的的素数,2的k倍都不是素数,k>=2
 *  - 下一个没有被筛掉的数是3,所以3是素数(原理:合数一定可以拆出一个小于自己的素数因子)
 *      - 删除3的k>=3倍数
 *  - 4 被删除,不用岀它的倍数
 *  - ....
 * */
void E_prime(int n){
    //memset(del,0,sizeof(del));
    for(int i=2;i<=n;i++){
        if( del[i] == 0){
            prime.push_back(i);
            if( i > n / i ) continue; //防溢出
            // 为什么从i*i开始删除?
            // 这是一个优化: 对于小于i的倍数来说,都已经尝试过!!
            for(int j=i*i;j<=n;j+=i) del[j] = 1;
        }
    }
}

int main(){
    E_prime(100); // 求100内的素数
    for (const auto& e : prime) {
        cout << e << " ";
    }
    cout << endl;
    return 0;
}
```

因为**有重复**的删除,所以时间复杂度为$O(n \log \log n)$,比枚举法要快.

### 二 最大公因数与最小公倍数

定义:

1. 公因数: $a \mid b \land a \mid c$,a是$b,c$的公因数.
2. 最大公因数: $gcd(b,c) =  max(A),A =\{a | a \mid b \land a \mid c\}$
3. 互素: $gcd(a,b) = 1$


我们早就就过$gcd$,也就是**辗转相除法**.代码很简单,如下

```cpp
int gcd(int a,int b)
{
    if(b == 0) return a;
    return gcd(b,a%b);
}
```

当然也可以使用c++内置的`__gcd()`函数.

证明:

1. 显然$0$与任意数$x$的最公因数都是$x$本身: $gcd(0,x) = x$.

设$a,b,r_1$,其中$r_1 = a \mod b$. 也就是可以写成带余除法的形式: $a = bq + r_1$

设$(a,b)$表示$a,b$公因数形成的集合

现在我们只要证明$(a,b) = (b,r_1)$,就能证明$gcd(a,b) = gcd(b,r_1)$

证明:$x \in (a,b) \to x \in (b,r_1)$,那么根据前提得到$x \mid a,x\mid b$,又得知$r_1 = a -bq$,根据整数的整除性质3,得到$x \mid a - bq \to x \mid r_1$.得到$(a,b) \subset (b,r_1)$

证明:$x \in (b,r_1) \to x \in (a,b)$,同理: $x \mid b ,x \mid r_1$,同样根据性质3得到$x \mid a = bq + r_1$,得到$(b,r_1) \subset (a,b)$ 

所以$(a,b) = (b,r_1)$,得证. 你可以写一个暴力的代码验证二者的集合是不是一样.


::: colorfulbox

重要性质

$$
gcd(a,b) = ax + by
$$
一定成立

a,b的最大公因数可以通过最a,b各乘以一个整数后相加凑出来

:::

证明: 辗转相除法加上数学归纳法.这个算法叫做$exgcd$算法.


::: colorfulbox

$$
a \mid bc \land gcd(a,b) = 1 \to a \mid c
$$
:::

证明见书P11


::: colorfulbox

设p是素数,若$p \mid ab$,则 $p \mid a \lor p \mid b$

:::


通过代码我们发现,$lcm(a,b) \times gcd(a,b) = | a \times b |$

gcd_lcm.py

如果证明这个结论的正确性呢? 先使用缩小法(特例法),把问题变得简单,当a,b互质时,$gcd(a,b) = 1$, 那么$lcm(a,b) = a \times b$. 先证明这个公式的正确性.

证明:

先把$lcm(a,b) = a \times b$ 转成我们容易理解的样子$a \cdot x = b \cdot y$,其中$x,y$是整数. $x = \frac{b \cdot y}{a}$,根据已知条件$a,b,x,y$是整数,a,b互质,所以$\frac{b \cdot y}{a}$是整数.但$b \div a$不是整数,那么必然$y \div a$是整数,所以$a \mid y$,同理$b \mid x$, 得到$y = k_1 a, x = k_2 b$,代入得到$a k_2 b = b k_1 a \to k_1 = k_2$,显然$k_1 = k_2 = 1$,得到最小的倍数,证明结束.

证明2: 再来证明$gcd(a,b) \neq 1$时

设$gcd(a,b) \times x = a , gcd(a,b) \times y = b$,使用反证法可以得到$gcd(x,y) = 1$,也就是$x,y$互质.

同样设$lcm(a,b) = a \times k_1 = b \times k_2$,其中$k_1,k_2$是整数.

综上得到 $gcd(a,b) \times x \times k_1 = gcd(a,b) \times y \times k_2 \to x \times k_1 = y \times k_2$, 已经知道$x,y$互质.根据上面已经证明的部分,得到$k_1 = y ,k_2 =x$ 这个时候才能使用$lcm(a,b)$最小

所以$gcd(a,b) \times lcm(a,b) = gcd(a,b) \times a \times y = gcd(a,b) \times b \times x = a \times b$.证明完毕.

其时这个证明起始思想来源于 算术基本定理,通过观察$lcm(a,b) \times gcd(a,b)$ 各自怎么拆分得到$a \times b$的形式,再加上**任意问题都是由简单问题组成**的观点递归分解证明2,,我们得到了这个结论.

又同样说明了: 当我们需要证明一个结论时,**先要观察数据**,这个步骤在<<怎样解题>>这本书叫做**熟悉题目,深入理解题目,寻求有用的思路,探索法**


### 三 算术基本定理

::: colorfulbox

任何大于1的整数都可以唯一分解成素因数乘积的形式

$$
n = p_1 ^ {a_1} \times p_2 ^ {a_2} \times \cdots \times p_k ^ {a_k}
$$

:::

证明: 1. 存在性 2. 唯一性 

存在性: 若一个数字n,不是素数,可以分解成$a \times b$ ,其中a是一个素数,b可以继续分解.

唯一性: 见书上P13. 先假设存在.然后根据素数不可能分解的性质.证明$p_1 = q_1$.然后递归.


## 第二讲 同余与同余方程

1. 利用同余关系进一步讨论了整除
2. 剩余类. 对同一个剩余类的数引入 加法,乘法.


### 一 同余

引入的同余的概念:

$$
a \equiv b \pmod{n}
$$

$$
a \equiv b \pmod{n} \Leftrightarrow n \mid a - b  \tag a
$$

感性的理解: 长度为a,b的木棍对于n都有相同的余数.也就多出来的长度一样.相减后,去除了那个多的部分.

证明: 写成带余除法$a = nq+r,b = n'q'+r'$

必要性: 根据前提显然$r = r'$,$a - b = n(q-q') \to n \mid a - b$.

充分性: $n\mid a-b \to n \mid n(q-q')+r - r' \to n \mid r - r'$,根据带余除法的定义,得到$-n < r - r' < n \to r - r' = 0 \to r = r'$,得证: $a \equiv b \pmod{n}$.

补充: 

1. 和的模等于模的和 $(a + b) \equiv (a \pmod{n} + b \pmod{n}) \pmod{n}$
2. 积的模等于模的积 $(ab) \equiv (a \pmod{n}b \pmod{n}) \pmod{n}$

性质:

1. 反身性,自反性
2. 交换律,对称性
3. 传递性

若$a \equiv b \pmod{n},c \equiv d \pmod{n}$,

1. $a+c \equiv b+d \pmod{n}$ 可加性
2. $ac \equiv bd \pmod{n}$ 可乘性
3. $ka \equiv kb \pmod{n}$ 可乘性推论
4. $a^k \equiv b^k \pmod{n}$ 可乘性推论

证明1: 必要性

$$
\begin{aligned}
a \equiv b \pmod{n},c \equiv d \pmod{n} &\to n \mid a -b ,n \mid c-d \\
& \to k_1 n = a -b , k_ 2 n = c-d \\
& \to (k_1 + k_2) n = (a+c) - (b+d) \\
&\to n \mid (a+c) - (b+d) \\
&\to a+c \equiv b+d \pmod{n}
\end{aligned}
$$

充分性只要反过来

证明2: 必要性

$$

\begin{aligned}
a \equiv b \pmod{n},c \equiv d \pmod{n} &\to n \mid a -b ,n \mid c-d \\
& \to k_1 n = a -b , k_ 2 n = c-d \\
& \to c k_1 n = ac - bc , b k_ 2 n = bc-bd \\
& \to (ck_1 + bk_2) n = ac - bd \\
& \to ac \equiv bd \pmod{n}
\end{aligned}
$$


消费律:  $ac \equiv bc \pmod{n} \land gcd(c,n) = 1 \to a \equiv b \pmod{n}$

证明:
根据同余与整除的等价关系,得到

$$
\begin{aligned}
ac \equiv bc \pmod{n} & \Leftrightarrow n \mid c(b-a)  \\
& \to \frac{c(b-a)}{n} \in \mathbb{Z} \\
& \to n \mid b-a \quad \text{因为} gcd(c,n) = 1 \\
& \to a \equiv b \pmod{n}
\end{aligned}
$$

消费律是充分必要的.

消去律其实是下面公式的特例,这个公式出现在B版的P24.

$$
ac \equiv bc \pmod{n} \Leftrightarrow a \equiv b \pmod{ \frac{n}{gcd(c,n)}}
$$


证明与上面其实是一样的.


这里只证明必要性:

设$c = k_1 \cdot (c,n),n = k_2 \cdot (c,n)$,那么$k_2 = \frac{n}{(c,n)}$.

```math
\begin{aligned}
ac \equiv bc \pmod{n} &\Leftrightarrow n \mid c(b-a)  \\
& \to \frac{c(b-a)}{n} \in \mathbb{Z} \\
& \to \frac{k_1 \cdot (c,n)\cdot (b-a)}{k_2 \cdot (c,n)} \in \mathbb{Z} \\
& \to \frac{k_1 \cdot (b-a)}{k_2} \in \mathbb{Z} \\
&\quad \text{因为} (k_1,k_2) = 1,\text{就变得和上面一样了}
& \to k_2 \mid b-a \\
& \to a \equiv b \pmod{k_2 = \frac{n}{(c,n)}} \\
\end{aligned}
```


### 二 剩余类及其运算

1. 剩余类定义
2. 代表元
3. 公式形式$a \equiv b \pmod{n} \Leftrightarrow [a] = [b]$的解法
4. 剩余类加法
5. 剩余类乘法
6. 零元
7. 单位元
8. 负元
9. **逆元**: 若$[a][b] = [b][a] = [1]$ ,记作$a^{-1} \equiv b \pmod{n}$

非零元$[a]$有逆元的充分必要条件: $gcd(a,n) = 1$,也就是说任何素数都有逆元.

### 三 费马小定理与欧拉定理

先发现,后证明.

发现当m为素数时,$a^m \equiv a \pmod{m}$.其中$a < m$,根据消去律可知$a^{m-1} \equiv 1 \pmod{m}$

写一下代码求一下

```python
<%-include("./feima_baoli.py")%>
```


::: colorfulbox

费马小定理

若$p$是素数,则$a^{p-1} \equiv 1 \pmod{p}$

也就是说$a^{p-2}$的是$a$的逆元.

:::

证明:

$a,2a,3a,\cdots ,(m-1)a$对m取余数两两不等,反证法$xa \equiv ya \pmod {m} \to x \equiv y \pmod {m}$显然不可能,所以这些数是$m$完全剩余类

同样$1,2,3,\cdots,m-1$也是$m$完全剩余类

所以

$$
a^{m-1}(m-1)! \equiv (m-1)! \pmod {m}
$$

又因为$gcd((m-1)!,m) = 1$,根据消去律得到

$$
a^{m-1} \equiv 1 \pmod {m}
$$


### 欧拉定理

::: colorfulbox
欧拉函数

$\psi(n)$表示$1,2,\cdots,n-1$中与n互质的个数,称为欧拉函数

:::

- 互素剩余类
- 完全剩余系(集合)
- 简化剩余系(集合)

$$
gcd(m_1,m_2) = 1 \to \psi(m_1m_2) = \psi(m_1) \cdot \psi(m_2)
$$


::: colorfulbox

欧拉定理

$$
m> 1 \land gcd(a,m) = 1 \to a^{\psi(m)} \equiv 1 \pmod{m}
$$

证明方法与费马小定理本质是一样的.但这要先用到$x_1,x_2,\cdots,x_{\psi(m)}$是模$m$的一个简化剩余系,则$kx_1,kx_2,\cdots,kx_{\psi(m)}$也是模$m$的一个简化剩余系(用到了抽屉原理).

:::
### 四 一次同余方程

### 五 拉格朗日插值法和孙子定理

### 六 弃九验算法

## 第三讲 一次不定方程

## 第四讲 数论在密码中的应用


## 裴蜀定理

## 威尔逊定理


::: colorfulbox

威尔逊定理

在初等数论中，威尔逊定理给出了判定一个自然数是否为质数的充分必要条件。即：当且仅当
${\displaystyle p}$为质数时：

$$
(p-1)! \quad \equiv \ -1 \pmod {p}
$$

::: 

这里只证明充分性.

这里需要证明一个前置的定理: 当$p$是素数,$n_1 \in [1,p-1]$,必然存在唯一逆元$n_2 \in [1,p-1]$,使得$n_1n_2 \equiv 1 \pmod {p}$

证明存在性: 

$$
\begin{aligned}
n_1n_2 \equiv 1 \pmod {p} &\Leftrightarrow p \mid n_1n_2 - 1 \\
& \Leftrightarrow kp = n_1n_2 - 1 \\
& \Leftrightarrow kp - n_1n_2 = 1 \\
& \Leftrightarrow kp + n_1n_2 = 1 \\
\end{aligned}
$$

根据裴蜀定理,因为$gcd(n1,p) = 1$,必然存在,一对整数$(k,n_2)$使得$kp + n_1n_2 = 1$成立

证明唯一性: 这里用到了群论逆元唯一性的证明:

设存在$b,b' \to ab \equiv 1 \pmod {p} \land ab' \equiv 1 \pmod {p}$

$$
\begin{aligned}
ab \equiv ab'  \pmod {p} \xrightarrow{ gcd(a,b) = 1} b \equiv b' \pmod {p} \\
\end{aligned}
$$

可能存在一个$a \in [1,p-1]$,它的逆元是自己本身.

$$
\begin{aligned}
    & a^2 \equiv 1 \pmod p \\
    & \Leftrightarrow p \mid a^2 - 1 \\
    & \Leftrightarrow p \mid (a-1)(a+1) \\
    & \xLeftrightarrow{a \in [1,p-1]}  a = 1 \lor a = p-1 
\end{aligned}
$$

于是我们可以这样说: 在$x \in [1,p-1]$中,除了$1,p-1$外,$[2,p-2]$这些数都存在一个对应的逆元,且两两配对.所以


$$
\begin{aligned} \prod_{i=2}^{p-2} x \equiv 1 \pmod {p}
&\xrightarrow{ 1 \equiv 1 \pmod p} \prod_{i=1}^{p-2} x \equiv 1 \pmod {p} \\
&\xrightarrow{ (p-1) \equiv (p-1) \pmod p} \prod_{i=1}^{p-2} x \cdot p-1 \equiv p-1 \pmod {p} \\
&\rightarrow (p-1)! \quad \equiv -1 \pmod {p} \\
\end{aligned}
$$


参考: https://zh.wikipedia.org/wiki/%E5%A8%81%E5%B0%94%E9%80%8A%E5%AE%9A%E7%90%86


## 二元一次方程

::: colorfulbox

有解的充要条件


$$
ax + bx =c \tag 1
$$

上式有解的充要条件是$(a,b) | c$

:::


证明必要性:因为有解，设解为$x_0,y_0$

$$
\begin{aligned}
& k_1 (a,b) x_0 + k_2 (a,b) y_0 = c \\
& \to (a,b) (k_1 x_0 + k_2 y_0) = c \\
&\to (a,b) | c
\end{aligned}
$$

充分性：

根据裴蜀定理，必然存在一给整数$x_0,y_0$,使得

$$
a x_0 + b y_0  = (a,b)
$$

设$(a,b) \cdot k = c \to k = \frac{c}{(a,b)}$,则上式两边同时乘以$k$得到: $k a x_0 + k  b y_0  = c \to$


## 剩余系

::: colorfulbox

完全剩余系

模$m$的每个剩余类中各取一个数组成的一个集合

:::


::: colorfulbox

简化剩余系

模$m$的互素类中各取一个数组成的一个集合

:::


## 欧拉函数


证明欧拉函数需要先证明这几个定理


::: colorfulbox

定理1: 剩余系集合相等

设$m\in \mathbb{z}$,$k,l$是固定的值,也是整数,且$(k,m) = 1$

1. 当x遍历模m的一个完全剩余系时,$f(x) = kx + l$ 也遍历模m的一个完全剩余系
2. 当x遍历模m的一个简化剩余系时,$f(x) = kx$ 也遍历模m的一个简化剩余系

:::

证明(1): 本质是证明两个集合$A,B$相等,也就是证明两个集合里的元素完全一样.我想到了两种方法.

设集合$A = \{x_0,x_1 ,\cdots, x_{m-1} \}$,映射$f(x) = (kx + l) \mod m, x\ in A$,$f(x)$的像是集合$B$

本质是证明$f(x)$是双射. 满射是显然的(注意这里,可以想到集合B的元素是mod来的,所以B一定是A的子集),下面只证明单射就可以了(两者的数量一样)

反证法,设$x_i \neq x_j$

$$
\begin{aligned}

& kx_i + l \equiv kx_j + l \pmod m \\
&\to kx_i \equiv kx_j \pmod m \\
&\to x_i \equiv x_j \pmod m \\
&\to x_i = x_j
\end{aligned}
$$


简单一点,可以先证明$kx_i \mod m$是完全剩余系,然后证明$x_i + l$本质是在一个圈上的移动,所以不会重复.


证明(2): 同理,证明$f(x)$是双射. 满射是显然的.下面只证明单射就可以了

设集合$C = \{x_1,x_2,\cdots,x_{\psi(m)} | (x_i,m) = 1\} \subset A$,映射$f(x) = kx \mod m, x\in C$,$f(x)$的像是集合$D$

现在要证明集合$C= D$,需要证明

1. 数量一样,也就是单射,这里参考(1)的证明方法
2. 我们知道$D \subset A$,这里只需要证明D满足C从A中选元素的条件即可,即$(kx_i,m) = 1$,根据算术基本定理,我们知道$(kx_i,m) = (k,m)(x_i,m) = 1$,所以D满足条件,所以$D \subset C$,所以$C = D$


::: colorfulbox

定理2: 

设$(m_1,m_2) = 1$

1. 当$x_1,x_2$遍历模$m_1,m_2$的完全剩余系时,$m2x+m_1y$也遍历模$m_1m_2$的完全剩余系
2. 当$x_1,x_2$遍历模$m_1,m_2$的简化剩余系时,$m2x+m_1y$也遍历模$m_1m_2$的简化剩余系

:::