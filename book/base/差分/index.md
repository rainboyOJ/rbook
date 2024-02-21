
设原数组的第$i$个元素为$a_i$,那么差分数组的第$i$个元素为$d_i = a_i- a_{i-1}$

有一组数据如下

$$
\begin{array}{r|c|c|c|c|c|c}
    
\text{下标} & 1 & 2 & 3 & 4 & 5 & 6  \\
\hline 
\text{原数组 } a[i]& 3 & 5 & 1 & 7 & 8 & 4 \\
\text{差分数组 } d[i]& 3 & 2 & -4 & 6 & 1 & -4 \\
\text{差分数组前缀和 } s[i]& 3 & 5 & 1 & 7 & 8 & 4 \\
\end{array}
$$

发现

1. 对差分数组进行前缀和操作,就可以得到原数组了
2. 差分是对前缀和的逆运算

```math
\begin{aligned}
S_i = \sum_{j=1}^i d_i &= d_1 +d_2 + \cdots + d_i \\
&= (a_1 - a_0)  + (a_2 - a_1) + \cdots  + (a_i - a_{i-1}) \\
&= (\bcancel{ a_1 } - a_0)  + (\bcancel{a_2} - \bcancel{a_1}) + \cdots  + (a_i - \bcancel{a_{i-1}}) \\
& = a_i - a_0 \;\;\; \text{因为$a_0 = 0$} \\
& = a_i
\end{aligned}
```



现在对原数组$a$的区间$[2,4]$上的每个数都增加$2$,得到如下

$$
\begin{array}{r|c|c|c|c|c|c}
    
\text{下标} & 1 & \color{Blue}{2}  & \color{Blue}{3} & \color{Blue}{4} & 5 & 6  \\
\hline 
\text{原数组 } a[i]& 3 & \color{Blue}{7} & \color{Blue}{3} & \color{Blue}{9} & 8 & 4 \\
\text{差分数组 } d[i]& 3 & \color{Blue}{4} & -4 & 6 & \color{Blue}{-1} & -4 \\
\text{差分数组前缀和 } s[i]& 3 & \color{Blue}{7} & \color{Blue}{3} & \color{Blue}{9} & 8 & 4 \\
\end{array}
$$

发现,对原数组进行区间$[2,4]$修改: 差分数组只会修改两个值，第一个值为$b_2 = b_2+2$，第二个值为$b_5 =b_5-2$,且对修改后的差分数组进行前缀后依然得到了原数组.

于是,得出结论,如果对原 数组进行区间$[l,r]$上的每个数都增加$v$,那么对应的差分数组只需要修改两位置$b_l = b_l+v$, $b_{r+1} = b_{r+1}-v$.原来需要$r-l+1$次的区间操作,现在只需要进行$2$次区间操作了,大大节省了时间.

对于,那些题目

- 多次区间修改(增减)
- 一次查询(查询原数组的值)

适合使用差分思想


## 二维差分

TODO

## 练习题目


- luogu P2367
- luogu P3397
- luogu P1969 积木大赛
- P3655
- P7404