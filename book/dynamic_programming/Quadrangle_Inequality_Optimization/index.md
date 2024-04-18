论文:

- [Optimum binary search trees
Prof. Dr. D. E. Knuth][1]
- [Efficient dynamic programming using quadrangle inequalities F. Frances Yao][2]

## 怎么使用

有一些DP问,通常为区间DP,它的状态转转移方程是这样的

$$
f(i,j) = \min\{f(i,k),f(k+1,j),f(i,j-1)\} + w(i,j) \quad (1 \leqslant i  \leqslant k < j \leqslant n)
$$


::: oneWordAlgo
当$i,j$增加的时间,最佳分割点$k$向右便宜
:::

在真实的做题目的时候,不需要严格的证明$w(i,j)$具有 1. 满足四边形不等式 2. 单调性 这两个性质. 只需要与一个普通的代码,观察最佳分割点是否向随着$i,j$的增加右移动,即满足下面的式子,就可以判断是否使用"四边形不等式优化"

$$

K_c(i,j) \leqslant K_c(i+1,j) \\
K_c(i,j) \leqslant K_c(i,j+1) \\
K_c(i,j) \leqslant K_c(i+1,j)  \leqslant K_c(i+1,j+1)
$$


例如石子合并问题

一般的代码

::: pseudocode

:::

使用"四边形不等式优化"后的代码

::: pseudocode

:::

## 相关定义

## 相关定理与证明

## 石子合并完整代码



a b c d

w(a,c) + w(b,d) <= w(a,d) + w(b,c)

对角线的和大于对边的和 yes

坐标 

A+C  <= B +  D


## 参考

- 算法竞赛 - 罗勇军 5.1 四边形不等式优化

[1]: https://www.semanticscholar.org/paper/Optimum-binary-search-trees-Knuth/c020b9fc5215297a4cc14cff7e1be4dcd9a05d44 "Optimum binary search trees Prof. Dr. D. E. Knuth"
[2]: https://cse.hkust.edu.hk/mjg_lib/bibs/DPSu/DPSu.Files/p429-yao.pdf "Efficient dynamic programming using quadrangle inequalities F. Frances Yao 1980 Proceedings of the twelfth annual ACM symposium on Theory of computing - STOC '80"