---
title : 分组背包
author: rainboy
update_time : 2023-04-22
---

<script setup>
import gallery from '~/bookComponents/gallery.vue'
</script>

[[toc]]

# 分组背包

## 问题描述

不同于01背包,只有**n个**物品,现在我们有**n组**物品,且**每组物品最多选一个**,问最大价值是什么?

```plaintext
<%- include("in.txt") %>
```


## 三维解法

类比于01背包的二维写法,我们很容易想到分组背包的三维写法

$f[i][j][w]$表示,考虑前$i-1$组物品和第$i$组背包内的前$j$个物品,在容量为$w$条件下,每组物品最多选一个(第$i$组的这个$j$个物品最多选一个的条件)下,能得到的最大价值 .

可以想到状态转移方程如下:

$$
f[i][j][W]   =  \begin{cases}
\ f[i-1][total(i-1)][W-w[i][j]]] + v[i][j] , W >=w[i][j] \\
\ f[i][j-1][W]
\end{cases}
$$

显然$f[i][j][w]$这个问题,转换成:
第$i$组第$j$个物品选

$$
f[i-1][total(i-1)][W - w[i][j]] + v[i][j]
$$

$totol(i-1)$ 表示第i组物品的数量
$v[i][j]$表示第i组第j个物品的价值
$w[i][j]$表示第i组第j个物品的重量

<gallery title="三维解法">
<img src="./asym/figux_1.svg"/>
<img src="./asym/figux_2.svg"/>
<img src="./asym/figux_3.svg"/>
<img src="./asym/figux_4.svg"/>
<img src="./asym/figux_5.svg"/>
</gallery>

## 二维解法

第i组内,前j个物品,总和前j-1有关,类比01背包,前i个物品总和前i-1个有关,

所以我们可以把组合物品的j维去掉

f[i][w] = max{f[i-1][W-w[i][j]] + v[i][j] ,f[i][w]}

如果去除j这一维后,怎么得到前j个物在容量为W的条件下的最大价值呢?


显然我们应该按这样的顺序求

figure_3.svg webm

保持容量w不变,然后去依次去求组内的前1个物品,前2个物品,...前j个物物品

因为当你求完前1个物品时 f[i][w] 就表示,前i组前1个物品在容量w下的最值,
当你考虑前2个物品时,f[i][w]此时还是前1个物品的值,正好用来更新前2个物品的值

```c
for( int i =1;j<=N;i++){
    //初始化j=0时,每个容量都应该是
    for(int k = 0 ; k<=C ; k++)
        f[i][k] = f[i-1][k];
    for( int j =1;j<=total(i);j++){
    for(int k = 1 ;k <= C;k++) { // 枚举容量

            //不选j的价值
            
            if( k>= w[i][j] )
                f[i][w] = max(f[i-1][W-w[i][j]] + v[i][j],f[i][w]);

        } // end for j
    } //end for k
} // end for i
```

可以看到竟然有二次for K 循环,代码这显然不是很优雅

```cpp {1-2}
for( int i =1;j<=N;i++){
    for(int k = 1 ;k <= C;k++) { // 枚举容量
        f[i][k] = f[i-1][k];
        for( int j =1;j<=total(i);j++){

            //不选j的价值
            
            if( k>= w[i][j] )
                f[i][w] = max(f[i-1][W-w[i][j]] + v[i][j],f[i][w]);

        } // end for j
    } //end for k
} // end for i
```



## 一维解法

同样的,求解前i组的信息,需要前i-1组的信息,能不能把i也压缩掉呢?

当我们求解 前 i j w,f[i][w],它需要的前i-1的信息为f[i-1][w-w[i][j]]

也就是上一组的更小的容量,类比01背包,当我们需要上一次信息的前面,为了避免覆盖信息,把容量倒过来求


figure_4.svg 轮播图


我们可以这样想:
组内的每个物品都要依次处理一遍w5,
然后又依次处理一遍w4,....

把组当成一个物品,那不就相当于,01背包的某个物品从大到小计算容量下的价值吗?

只不过分组背包要得到一个容量下的答案就要把一组内的物品一次处理,所以本质还是01背包.


## 适用模型

分球模型

## 代码模板

虽然代码看起来很长,但是它的核心只有三行:

```pseudocode
\begin{algorithm}
\begin{algorithmic}
    \FOR {$i : 1 \rightarrow \ groupCount $}
    \FOR {Capacity $: Max \rightarrow 0$}
        \FOR {each item in group[i]}
            \STATE Update max value for the current capacity
        \ENDFOR
    \ENDFOR
    \ENDFOR
\end{algorithmic}
\end{algorithm}
```

```
枚举组i
    倒序枚举容量C
        处理第i组内的每个物品在当前容量下的最值
```

这三行代码与`01背包`的是一样

```cpp {34-36}
<%- include("template.cpp") %>
```

## 练习题目

假设有3组物品：

- 组 1：{物品1，体积3，价值4}, {物品2，体积2，价值3}, {物品3，体积4，价值2}
- 组 2：{物品4，体积1，价值4}, {物品5，体积2，价值5}
- 组 3：{物品6，体积4，价值3}

并且背包的容量限制为 6。 要确定在此约束下选择哪些物品以最大化总价值，可以使用分组背包算法。

数据

```
<%- include("in2.txt") %>
```

答案

```
<%- include("in2.ans") %>
```

完整代码 

```cpp
<%- include("example1.cpp") %>
```
