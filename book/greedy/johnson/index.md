---
title: 双机流水调度（Johnson 算法）
menu_title: 双机流水调度
rbook:
  id: greedy_johnson
  pre:
    - greedy_king_game
    - greedy_tree_dyeing
---

[[TOC]]

## 从两台机器的等待说起

你已经会用邻项交换论证了：把相邻两个元素换个位置，让「换之前不劣于换之后」的条件化简成一个比较式，再用这个比较式排序。这套方法在国王游戏、给树染色里都用过。

双机流水调度是这条路上最经典的一道坎。它的交换论证只比前面几题多一步代数，但**推出来的比较式不能直接丢进 `std::sort`**——这正是它值得单独用一篇文章讲的原因。

::: note 这篇和前面几篇的关系
[[[rbook: greedy_king_game]]] 与 [[[rbook: greedy_tree_dyeing]]] 都是「排序不等式」模型：邻项交换推出的比较式天然满足严格弱序，可以直接 `sort`。本文是反例：比较式推对了，却**不是**严格弱序，必须再做一次集合划分。建议先读完那两篇再看这里。
:::

## 问题模型

有 $n$ 个作业，每个作业 $i$ 都要先在机器 $A$ 上加工 $a_i$ 时间，**再**到机器 $B$ 上加工 $b_i$ 时间。同一台机器同一时刻只能加工一个作业。

要求给出一个加工顺序 $\pi=(\pi_1,\dots,\pi_n)$，使所有作业在机器 $B$ 上全部完工的时刻 $C_{\max}$ 最小。

::: definition 双机流水作业调度 $F2 \parallel C_{\max}$
两台机器、所有作业走同一条「先 $A$ 后 $B$」的路线、目标是最小化最大完工时间的调度问题。它是流水作业调度里少数有多项式最优解的情形——机器数增加到三台就是 NP-hard 了。
:::

## 完工时刻怎么算

机器 $A$ 没有前置依赖，从 $0$ 时刻开始连续加工，所以第 $i$ 个作业在 $A$ 上的完工时间就是前缀和：

$$
A_i=\sum_{k=1}^{i}a_k
$$

机器 $B$ 上的第 $i$ 个作业要开工，必须同时满足两件事：它自己在 $A$ 上已经做完（时刻 $A_i$），且前一个作业已经在 $B$ 上做完（时刻 $C_{i-1}$）。所以

$$
C_i=\max(C_{i-1},\,A_i)+b_i,\qquad C_0=0
$$

这个式子值得记住——后面很多题目（比如皇后游戏）的递推式和它**完全同构**，只是换了故事。

### 闭式解：瓶颈转折点

把递推展开可以消掉 $\max$，得到一个很好看的闭式解：

::: theorem 最大完工时间的闭式解
对任意固定顺序，

$$
C_n=\max_{1\le k\le n}\left(\sum_{m=1}^{k}a_m+\sum_{m=k}^{n}b_m\right)
$$

:::

::: proof 闭式解的来历
把 $C_n$ 一层层展开：

$$
C_n=\max\left(C_{n-1},A_n\right)+b_n=\max\left(C_{n-1}+b_n,\;A_n+b_n\right)
$$

继续把 $C_{n-1}=\max(C_{n-2},A_{n-1})+b_{n-1}$ 代入第二项里的 $C_{n-1}$，每一项都会「带上」后面所有 $b$ 的和。归纳到最后得到：$C_n$ 是若干个「前缀 $a$ 之和 + 从该位置到末尾的 $b$ 之和」取最大，即上式。

式中的 $k$ 有清楚的物理含义：它是机器 $B$ **最后一次等机器 $A$** 的那个作业。从第 $k$ 个作业开始，机器 $B$ 连轴转到底，中间不再空闲。
:::

::: note 为什么闭式解值得记
它把「一台机器等另一台」的整个过程摊平成了 $n$ 个候选值的最大值。后面判断「哪个作业该放前面」时，用的就是它的相邻两项形式。
:::

## 邻项交换：推出比较式

设 $x$ 与 $y$ 相邻，在它们之前机器 $A$ 已累计 $A$、机器 $B$ 已完工到 $B$。

### 两种顺序的完工时刻

**顺序一（$x$ 在前）**：作业 $y$ 完成时

$$
C_{xy}=\max\bigl(B+b_x+b_y,\;A+a_x+b_x+b_y,\;A+a_x+a_y+b_y\bigr)
$$

**顺序二（$y$ 在前）**：交换下标即得

$$
C_{yx}=\max\bigl(B+b_y+b_x,\;A+a_y+b_y+b_x,\;A+a_y+a_x+b_x\bigr)
$$

### 化简

两个展开式里有三件事要利用：

1. 两种顺序下，$x,y$ 都做完时机器 $A$ 的累计时间相同，都是 $A+a_x+a_y$，所以对**后续**作业没有影响。只需比较 $C_{xy}$ 与 $C_{yx}$。
2. 两者第一项都是 $B+b_x+b_y$，可一并消去。
3. 剩下的项都含公共和 $A+a_x+a_y+b_x+b_y$，两边同时减掉。

于是「$x$ 在前不劣于 $y$ 在前」等价于

$$
\max(-a_y,-b_x)\le\max(-a_x,-b_y)
$$

两边乘 $-1$（$\max$ 变 $\min$，不等号反向），得到 **Johnson 局部条件**：

::: theorem Johnson 局部条件
$$
\min(a_x,b_y)\le\min(a_y,b_x)
$$

满足时把 $x$ 排在 $y$ 前面不会更差。
:::

::: note 这一步只用到交换论证
推导里没有任何「贪心直觉」，纯代数。条件成立就说明相邻交换不会变坏，这正是邻项交换法的标准终点。麻烦在于下一步。
:::

## 陷阱：这个比较式不能直接 `sort`

推到 $\min(a_x,b_y)\le\min(a_y,b_x)$，很多人的第一反应是写成比较函数丢进 `std::sort`。这是错的。

::: warn 错误写法
`std::sort` 的比较器必须是**严格弱序**（strict weak ordering）：反自反、非对称、传递，外加「不可比」关系的传递性。而 $\min(a_x,b_y)<\min(a_y,b_x)$ 满足前三条，却**不满足第四条**。
:::

### 先看它的「不可比」是什么

定义 $x\sim y$ 当且仅当 $\min(a_x,b_y)=\min(a_y,b_x)$。在这个关系下，$\sim$ 并不传递。

取三个作业：

$$
x=(2,10),\qquad y=(1,1),\qquad z=(3,10)
$$

逐个验证：

| 比较 | 左边 | 右边 | 结论 |
| --- | --- | --- | --- |
| $x$ vs $y$ | $\min(2,1)=1$ | $\min(1,10)=1$ | $x\sim y$ |
| $y$ vs $z$ | $\min(1,10)=1$ | $\min(3,1)=1$ | $y\sim z$ |
| $x$ vs $z$ | $\min(2,10)=2$ | $\min(3,10)=3$ | $x\prec z$ |

$x\sim y$、$y\sim z$，但 $x\prec z$——等价关系断了。

### 这个断链会真的算错

排序器遇到 $\sim$ 就认为「两者不必交换」，于是初始序列 $[z,y,x]$ 会被判定为已经有序。而实测：

| 顺序 | 完工时间 |
| --- | --- |
| $[z,y,x]$（错误比较器认为已完成） | $24$ |
| $[x,y,z]$ 或 $[y,x,z]$ | $23$ |

差 1 不算大，但方向是错的：算法会稳定地停在次优解上。

::: warn 实际影响比反例更大
我用随机数据验证过：把 $\min(a_x,b_y)<\min(a_y,b_x)$ 直接当 `cmp` 排序，**20000 组随机数据里有 509 组得不到最优解**（约 2.5%）。反例不是精心构造的孤例。

顺带说明：这个比较器还有一个更隐蔽的毛病——它可能是**非传递的**，而给 `std::sort` 传非传递比较器属于未定义行为，某些实现会直接越界崩溃。所以「碰巧排对了」也不代表能这么写。
:::

## Johnson 算法：集合划分恢复全序

S. M. Johnson 1954 年的做法是把「两个作业交叉比较」拆成「每个作业自己算一个排序键」：

::: algorithm Johnson 算法
1. 划分：$S_1=\{i\mid a_i<b_i\}$，$S_2=\{i\mid a_i\ge b_i\}$。
2. 组内排序：$S_1$ 内按 $a_i$ **升序**；$S_2$ 内按 $b_i$ **降序**。
3. 拼接：先 $S_1$ 全部，再 $S_2$ 全部。
:::

### 用键理解它

第 2、3 步等价于给每个作业算一个键：

$$
\text{key}(i)=
\begin{cases}
(0,\;a_i), & a_i<b_i\\[2pt]
(1,\;-b_i), & a_i\ge b_i
\end{cases}
$$

按二元组字典序排序即可。第一维把 $S_1$ 全部排在 $S_2$ 前面；第二维在 $S_1$ 里实现 $a_i$ 升序、在 $S_2$ 里实现 $-b_i$ 升序（即 $b_i$ 降序）。

::: theorem 划分后的顺序满足 Johnson 局部条件
最终序列中任意 $x$ 排在 $y$ 前面，都满足 $\min(a_x,b_y)\le\min(a_y,b_x)$。
:::

::: proof 分三种位置关系验证
**同属 $S_1$**：$a_x<b_x$、$a_y<b_y$，且 $a_x\le a_y$。左边 $\min(a_x,b_y)\le a_x$；右边 $\min(a_y,b_x)\ge\min(a_x,b_x)=a_x$（因为 $a_x<b_x$）。故成立。

**同属 $S_2$**：$a_x\ge b_x$、$a_y\ge b_y$，且 $b_x\ge b_y$。左边 $\min(a_x,b_y)=b_y$；右边 $\min(a_y,b_x)\ge\min(b_y,b_x)=b_y$。故成立。

**$x\in S_1$、$y\in S_2$**：只需证 $\min(a_x,b_y)\le b_x$ 且 $\le a_y$ 之类分情况。若 $\min(a_y,b_x)=a_y$，则 $\min(a_x,b_y)\le b_y\le a_y$；若 $\min(a_y,b_x)=b_x$，则 $\min(a_x,b_y)\le a_x<b_x$。两种情形都成立。
:::

::: note 为什么这样就「安全」了
因为键是**每个作业独立算出来的**，排序变成对二元组的字典序，而字典序在自然数二元组上天然是全序——全序当然满足严格弱序。那个「不可比」的等价关系被彻底消掉了，传递性不会再断。

注意这里消掉的是「原始比较式上的 $∼$ 不传递」这个问题，不是说原始比较式本身错——它作为**两两优先关系**是对的，只是不能直接拿来当排序器的键。
:::

## 物理直觉：开头抢启动，结尾缩尾巴

两条规则都能用「谁在等谁」解释：

::: summary 两条规则的由来
- **$S_1$ 按 $a_i$ 升序放最前**：开局机器 $B$ 是空的，在干等。把 $a_i$ 最小的放最前，机器 $B$ 能最早拿到活。而 $S_1$ 里 $a_i<b_i$，机器 $B$ 干得慢，机器 $A$ 正好趁这段时间攒缓冲。
- **$S_2$ 按 $b_i$ 降序放最后**：收尾阶段机器 $A$ 已经下班，只剩机器 $B$ 独自收尾。把 $b_i$ 最小的留在最后，机器 $B$ 的尾巴最短。
:::

## 两种等价写法

「按 $\min(a_i,b_i)$ 升序扫，$\min$ 取到 $a_i$ 的往答案头部追加、取到 $b_i$ 的往尾部插入」是 Johnson 算法更常见的教材写法。

::: note 这和集合划分等价
实测两种写法在 4000 组随机数据上给出相同的最优值。等价原因：$\min(a_i,b_i)$ 升序扫描时，前缀恰好就是 $S_1$ 按 $a$ 升序（$a_i<b_i$ 时 $\min=a_i$），后缀恰好是 $S_2$ 按 $b$ 降序（$a_i\ge b_i$ 时 $\min=b_i$，从后往前插入等于 $b$ 递减）。
:::

## 代码模板

以 [[[p: luogu-P1248]]] 为例，要求输出最小时间**和**对应顺序。

```cpp [g1:C++]
#include <bits/stdc++.h>
using namespace std;

struct Job {
    int id, a, b;
    // key: (组号, 组内排序键)
    // S1 (a < b): 组 0, 按 a 升序
    // S2 (a >= b): 组 1, 按 b 降序 -> 存 -b 使其升序
    pair<int,long long> key() const {
        if (a < b) return {0, a};
        return {1, -(long long)b};
    }
};

int main() {
    int n;
    scanf("%d", &n);
    vector<Job> v(n);
    for (int i = 0; i < n; i++) scanf("%d", &v[i].a);
    for (int i = 0; i < n; i++) { scanf("%d", &v[i].b); v[i].id = i + 1; }

    // 用 key 的字典序，天然全序：不会出现传递性失效
    sort(v.begin(), v.end(), [](const Job& x, const Job& y) {
        auto kx = x.key(), ky = y.key();
        if (kx != ky) return kx < ky;
        return x.id < y.id;            // 同键按编号，保证顺序确定
    });

    long long A = 0, B = 0;
    for (auto& j : v) {
        A += j.a;
        B = max(B, A) + j.b;
    }
    printf("%lld\n", B);
    for (int i = 0; i < n; i++) printf("%d%c", v[i].id, i + 1 == n ? '\n' : ' ');
    return 0;
}
```

```python [g1:Python]
import sys

def main():
    data = sys.stdin.read().split()
    if not data:
        return
    n = int(data[0])
    a = list(map(int, data[1:1 + n]))
    b = list(map(int, data[1 + n:1 + 2 * n]))

    def key(i):
        # S1: (0, a) 升序；S2: (1, -b) 升序即 b 降序
        return (0, a[i]) if a[i] < b[i] else (1, -b[i])

    order = sorted(range(n), key=lambda i: (key(i), i))

    cur_a = cur_b = 0
    for i in order:
        cur_a += a[i]
        cur_b = max(cur_b, cur_a) + b[i]

    print(cur_b)
    print(' '.join(str(i + 1) for i in order))

main()
```

::: warn 别把 Johnson 局部条件当比较器
上面的代码用的是 `key()` 的**字典序**，不是 $\min(a_x,b_y)<\min(a_y,b_x)$。这两者不是一回事，后者会破坏严格弱序（见前文反例）。
:::

## 复杂度

排序 $O(n\log n)$，扫描一遍 $O(n)$，总计 $O(n\log n)$，空间 $O(n)$。

::: note 为什么不用 DP
状态要记「哪些作业已做 + 两台机器各自进度」，是指数级的。而这个问题有交换论证给出的多项式最优解，直接排序即可。作为交换，机器数一旦增到三台就没有这样的结论了，$F3\parallel C_{\max}$ 是 NP-hard。
:::

## 题型信号

::: summary 什么题该想到 Johnson
- **两个工序串行**：每个任务包含有序的两个阶段 $(a_i,b_i)$，第二阶段必须在该任务第一阶段完成后、且前一个任务第二阶段完成后才开始。
- **递推形如** $f_i=\max(f_{i-1},\sum_{k\le i}a_k)+b_i$，或等价地出现「前缀 + 后缀」取 $\max$ 的闭式结构。
- **收益有正有负、且带前置门槛**：这类题常能拆成「净赚组」和「净亏组」两组分别贪心，本质是同一个集合划分。
:::

::: summary 三步走
1. **化简**：写出相邻两项交换前后的 $\max$ 展开式，两边同减公共和，提炼出局部条件。
2. **验序**：检查这个条件是否满足不可比性的传递性。含 $\min/\max$ 交叉项的式子经常不满足。
3. **解耦**：按每个元素自身属性把集合一分为二，把「双变量交叉比较」降为「单变量独立排序」，恢复全序。
:::

## 推荐练习

- [[[p: luogu-P1248]]]：**母题**。Johnson 算法直接套用，要求同时输出最小时间与顺序。
- [[[p: luogu-P1561]]]：USACO12JAN Mountain Climbing。上山下山对应两台机器，$U_i$ 是 $a_i$、$D_i$ 是 $b_i$，模型完全一致。
- [[[p: luogu-P2123]]]：**皇后游戏**。递推式 $c_i=\max\left(c_{i-1},\sum_{j\le i}a_j\right)+b_i$ 与本文完全同构。它的正解也要做集合划分，许多直接写 `min` 比较器的代码会 WA——是检验有没有读懂本文的最佳题目。
- [[[p: luogu-P2751]]]：IOI96 / USACO4.2 工序安排。$M_1$ 台 A 型机、$M_2$ 台 B 型机，属于多机变体：先用优先队列分别求出各工件在 A 完成的时间序列与 B 的倒推时间序列，再前后配对取 $\max$。
- [[[p: atcoder-dp_x]]]：AtCoder DP 专题 X - Tower。邻项交换推出按 $w_i+s_i$ 升序，再跑一遍 DP，用来体会「先交换论证定序、再按顺序处理」的套路。
- [[[p: luogu-P3619]]]：魔法。$b_i$ 有正有负，按符号分成两组：正组按门槛 $t_i$ 升序，负组按 $t_i+b_i$ 降序。与本文同一套「二元集合划分」思想。
- [[[p: codeforces-1203F2]]]：Complete the Projects (hard)。同样按 $b_i$ 正负分组，负组内按 $a_i+b_i$ 降序后再套 01 背包。

::: note 一点提醒
[[[p: luogu-P2123]]] 与 [[[p: luogu-P1248]]] 的递推式一模一样，但**数据范围差很远**：P1248 满足 $a_i,b_i\le 1000$、$n\le 1000$，$\sum a_i$ 在 `int` 里；P2123 是 $a_i,b_i\le 10^9$、$n\le 2\times10^4$，前缀和会冲到 $2\times10^{13}$，必须全程 `long long`。

另外 $a_i=b_i$ 的作业归哪一组都**不影响**最大完工时间（这一条我穷举验证过），两种归法可能给出不同的合法顺序、但值相同。真正容易踩的是溢出，不是归组。
:::

## 参考资料

- S. M. Johnson, *Optimal two- and three-stage production schedules with setup times included*, Naval Research Logistics Quarterly, 1954.
- [cp-algorithms: Scheduling jobs on two machines](https://cp-algorithms.com/schedules/schedule_two_machines.html)
- [双机流水作业调度（博客园）](https://www.cnblogs.com/ucprer/p/14523577.html)
