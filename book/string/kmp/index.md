---
title: KMP算法
author: rainboy
update_time : 2023-09-06
status: TODO
---



> 在[计算机科学](https://zh.wikipedia.org/wiki/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%A7%91%E5%AD%A6 "计算机科学")中，**Knuth-Morris-Pratt[字符串查找算法](https://zh.wikipedia.org/wiki/%E5%AD%97%E7%AC%A6%E4%B8%B2%E6%9F%A5%E6%89%BE%E7%AE%97%E6%B3%95 "字符串查找算法")**（简称为**KMP算法**）可在一个[字符串](https://zh.wikipedia.org/wiki/%E5%AD%97%E7%AC%A6%E4%B8%B2 "字符串")`S`内查找一个词`W`的出现位置。一个词在不匹配时本身就包含足够的信息来确定下一个匹配可能的开始位置，此算法利用这一特性以避免重新检查先前配对的[字符](https://zh.wikipedia.org/wiki/%E5%AD%97%E7%AC%A6 "字符")。
> 这个算法由[高德纳](https://zh.wikipedia.org/wiki/%E9%AB%98%E5%BE%B7%E7%BA%B3 "高德纳")和[沃恩·普拉特](https://zh.wikipedia.org/w/index.php?title=%E6%B2%83%E6%81%A9%C2%B7%E6%99%AE%E6%8B%89%E7%89%B9&action=edit&redlink=1)在1974年构思，同年[詹姆斯·H·莫里斯](https://zh.wikipedia.org/w/index.php?title=%E8%A9%B9%E5%A7%86%E6%96%AF%C2%B7H%C2%B7%E8%8E%AB%E9%87%8C%E6%96%AF&action=edit&redlink=1)也独立地设计出该算法，最终三人于1977年联合发表。
> 来自 [wikipedia ](https://zh.wikipedia.org/zh-cn/KMP%E7%AE%97%E6%B3%95)

KMP是这个算的三个作者,Knuth,Morris,Pratt的首字母缩写得到的. [Knuth–Morris–Pratt algorithm - Wikipedia](https://en.wikipedia.org/wiki/Knuth%E2%80%93Morris%E2%80%93Pratt_algorithm)

KMP算法来解决这样的问题:

在字符串S中是否存在子串a,且找出所有a子串出现的位置,时间复杂度$O(n)$

KMP算法是一个字符串匹配算法,它是一个可以在**线性时间**,$O(n+m)$,求出$P$串在$S$串每次出现的位置.


::: info

$next[i]$表示"P中以i为结尾的子串(称为``P_i``)"与"P的前缀部分"能匹配的最长长度,其中``P_i``长度必须``< i``,也就说``P_i``不能是前缀
:::

核心:当已知`next[1] \cdots next[i-1]`,已知时,如何求``next[i]``,这是一种递归的结构!

## 1. next数组的创建

next数组是整个kmp的核心,是最巧妙的地方,
![[读书笔记/算法竞赛进阶指南/0x10 基本数据结构/kmp_next.svg]]
先来看`next`数组的定义,`next[i]`表示**字符串S的以i位置为结尾的非前缀字符串(也就是最长长度为$i-1$)与S的前缀能够匹配的最长长度**,公式化的描述如下:

$$
next[i] = max\{j\} , j < i , S[i-j+1,i] = S[1,j]
$$

我先写一个朴素的算法来求解``next[i]``,字符串为`abababac`

```cpp
TODO
```

得到结果

```
+---+---+---+---+---+---+---+---+
| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | index
+---+---+---+---+---+---+---+---+
| a | b | a | b | a | b | a | c | string
+---+---+---+---+---+---+---+---+
| 0 | 0 | 1 | 2 | 3 | 4 | 5 | 0 | next
+---+---+---+---+---+---+---+---+
```

从上面我们可以看出

- 当已经求出$next[i]$的时,现在需要求$next[i+1]$,如果$s[i+1]=s[next[i]+1]$时,那显然$next[i+1] = next[i]+1$
- 如果`s[i+1] != s[next[i]+1]`,此时,我们应该怎么办呢?难道需要再次从头去尝试吗?


此时, 已知$next[1]~next[7]$, 如何去求$next[8]$呢?

next[7] = 5

因为c!=b,也就是P[8] != P[6] != P[next[8-1]+1]
上一个字符P[7]最大匹配长度是next[7],P[7]最长匹配的下一个字符$P[next[8-1]+1] = P[6]$
和P[8]不相同,也就不能延续上一次的匹配了,发生了**失配**


显然**失配**时,需要查找下一个最大可能的匹配长度是多少

想一想$next[7] = 5 $ 表示P的前5个字符与第7个位置结尾的后5个字符相同

那么$next[5]$,也就是$next[next[7]]$表示什么呢?

$next[7] = 5$ 表示P的前5个字符与第7个位置结尾的后5个字符相同
$next[5] = 3$又表示前3个字符与第5个位置的后三个字符相同
所以前3个字符必然与第7个位置结尾的后3个字符相同


显然这是种一中递归的结构,当我们失配时,不停用那next去匹配下去,**直到成功或匹配长度为0**

得到一个字符中的自我匹配的代码为:

```cpp
// pre表示当前位置与前缀匹配的长度
next[1] =pre = 0;
for(int i =2;i<=n;i++) { //枚举每个字符
	while(pre > 0 && p[i] != p[pre+1]) pre =next[pre]; // 回退下一个候选项
	if(p[i]==p[pre+1]) pre++;
	next[i] = pre;
}
```

## 2. 求一个p串在s串中的匹配


失配的条件增加了一条:`pre == n`表示s[i]的上一个字符已经达到了最大匹配,不能在拓展

- 和`s[1]`匹配时,`pre==0`,这样`s[1]`就能和`P[1]`进行尝试匹配
- `f[i]`表示s串的第i个位置与p串的最长匹配长度

```cpp
for(int i=1 ;i<=len(s);i++) {
	while( pre > 0 && (pre == n || s[i] != p[pre+1])) pre = next[pre];
	if( s[i] == p[pre+1]) pre++;
	f[i] = pre;
	//if( f[i] == n) 得到了一个a的子串
}
```

TODO,需要动画来进行更好的理解

## KMP的功能

- 求字符串的最小循环节,题目`POJ1961/AcWing141`,见pcs




