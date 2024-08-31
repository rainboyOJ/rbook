
## 证明


目前我见到的最好的证明: https://forthright48.com/lucas-theorem-proof-and-applications/

我看了多个证明,最后一步都是转成



$$
\begin{aligned}
(1+x)^n &= (1+x)^{sp+q} \\
&=[(1+x)^p]^s \times (1+x)^q
&\equiv (1+x^p)^s \times (1+x)^q \quad (mod\quad p) \\
&\equiv \sum_{i=0}^s\binom{s}{i}x^i \times \sum_{j=0}^p \binom{p}{j}x^j \quad (mod\quad p)
\end{aligned}
$$

关键在于最后一步:对比系数:比较左式的$(1+x)^n$里$x^m$的系数是$\binom{n}{m}$,然后证明右式的$x^m$的系数是一定只是唯一的,且为$x^tp \times x^r$的系数.然后怎么怎么.

所以上面的最后一步的证明,就是类似的想法:
$(a+b) \equiv (c+d) \mod p$,所以$a \equiv c \mod p$.
我不能接受.

如果谁能理解,请告诉我. mail: rainboylvx@qq.com

## 参考

- https://blog.csdn.net/Qiuker_jl/article/details/109528164
- [算法学习笔记(25) 卢卡斯定理 - 知乎](https://zhuanlan.zhihu.com/p/116698264)