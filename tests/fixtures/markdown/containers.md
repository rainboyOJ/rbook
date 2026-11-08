::: 定义 欧拉函数
$\varphi(n)$ 表示 $1\sim n$ 中与 $n$ 互质的数的个数。
:::

::: theorem 一维四边形不等式具有决策单调性 id=thm-1
对任意 $a\le b\le c\le d$，有 $w(a,c)+w(b,d)\le w(a,b)+w(c,d)$。
:::

::: proof
由上一步的单调性直接推出。
:::

::: note label=口诀 icon=bulb
中转点 `k` 最外层。
:::

::: warn 这里的 `k` 必须最外层
写在内层就会用到本阶段的中间结果。
:::

::: summary
全源最短路只有三重循环。
:::

::: fold 展开看推导
折叠内容
:::

::: pseudocode
伪代码内容
:::
