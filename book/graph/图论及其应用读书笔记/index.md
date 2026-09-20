

::: colorfulbox

支配集

定义:

对于无向图 $G=(V,E)$，若 $V'\subseteq V$ 且 $\forall v\in(V\setminus V')$ 存在边 $(u, v)\in E$ 满足 $u\in V'$，则 $V'$ 是图 $G$ 的一个 **支配集 (dominating set)**。

:::

人话：从图 $G$ 里选出一批点，使得图中任意一个**没被选中**的点，都至少与一个**被选中**的点相邻。这些被选中的点组成的集合就是一个支配集。

