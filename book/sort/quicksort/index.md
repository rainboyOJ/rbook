## 代码


一定非常简单的递归思想: TODO

```
<%- include("./code/plain_quick_sort.cpp")%>
```

## 标准代码

怎么不要两个辅助的数组`q1,q2`?
也就是怎么原地修改?


取出数组的第一个元素, 机器人互相扔箱子里的值.


证明这个算法是对的:

1. one操作可以分成两个部分.
2. 递归一定会缩小范围

## 更好的代码

1. 一定要取第一个元素作为key? 这样可能会被针对啊,例如数据TODO,的时间就会退化成$n^2$

优点:
码量更少,且可以进行随机化


证明, 经过`one`操作后,L,R 其中任意一个区间不可能为空集

可以想到: [l,r] 至少有两个元素

1. 证明R不可能为空集,R区间是由[j+1,r]得到的

等价证明j至少++两次

可以想到,j最右的情况下停止在r,那么i一定会遇到一个>=key的值(因为存在key的值),那么i的值一定会交换到j,

第二次j一定还会j++,那保证[j+1,r]不为空


2. 证明L不可能为空集,L区间是由[l,j]得到的,也就是证明j不可能变成l-1,最多变成l

j到多变成l!!!!

考虑到j先走,那么j第一趟行走,最多走到L(L就key,且>L,>key),(因为>=key)


如果走到L,那么i变化一次后,与j重合,算法停止

如果没有走到L,
看i再走,
可能走过了L,TODO ,后面就简单了

```cpp
<%- include("./code/quick_sort.cpp")%>
```
