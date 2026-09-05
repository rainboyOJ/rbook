开始证明:$\cal{Proof}.$

使用归纳法,证明`bs_find(l,r,val)`代码的正确性

只有1个元素的时候$a_1$,需要创建一个元素$a_2 = \infin$, 问题就变成求$f(1,2,val)$,取$m = (1+2) \gg 1 == 1$

分类讨论如下

1. 情况1: $check(1,val) = true \iff a_1 \geqslant val$,`check`函数成立,则问题变成$f(1,1,val) == 1$,得到正确答案
2. 情况2: $check(1,val) = false \iff a_1 \ngeqslant val$,`check`函数不成立,则问题变成$f(2,2,val) == 2$,得到正确答案

结论:当只有一个元素$a_1$时,函数`bs_find`可以得到正确答案


有两个元素$a_i,a_{i+1}$,且保证$check(i+1,val) = true$成立,取$m = (i+(i+1) / 2 = i$,说明当两个相当位置$i,i+1$,进行`mid`函数的运算后一定得到$i$,也就是较小的那个位置.

分类讨论如下

1. 情况1: $check(m=i,val) = true \iff a_i \geqslant val$,`check`函数成立,则问题变成$f(i,i,val) == i$,得到正确答案
2. 情况2: $check(m=i,val) = false \iff a_i \ngeqslant val$,`check`函数不成立,则问题变成$f(i+1,i+1,val) == i+1$,得到正确答案

结论:当只有两个元素$a_i,a_{i+1}$时,且$check(i+1,val)=true$成立时,函数`bs_find`可以得到正确答案

同理,有$3$个元素:$a_i,a_{i+1},a_{i+1}$,且保证$check(i+2,val)=true$成立时,函数`bs_find(i,i+2,val)`可以得到正确的答案


有$2k$(偶数)个元素的时候$a_1,a_2,\cdots,a_{2k}$, 且保证$check(2k,val)=true$成立时,取$m = (1+2k) \gg 1 = k$


分类讨论如下

1. 情况1: $check(m=k,val) = true \iff a_k \geqslant val$,`check`函数成立,则问题变成$f(1,k,val)$,
2. 情况2: $check(m=k,val) = false \iff a_k \ngeqslant val$,`check`函数不成立,则问题变成$f(k+1,2k,val)$

于是问题就变成是一个长度为$k$的子问题,问题正确性由子问题的正确性保证

同理,当有$2k+1$(奇数)个元素的时候$a_1,a_2,\cdots,a_{2k}$, 且保证$check(2k+1,val)=true$成立时,取$m = (1+2k+1) \gg 1 = k+1$,问题就变成是一个长度为$k+1$,或$k$的子问题,问题正确性由子问题的正确性保证

这样一直到分解,最后剩余的元素个数,一定会变成$2$或$3$,而这两个长度,已经验证成功.


证明完毕.$\cal{Q.E.D}$



