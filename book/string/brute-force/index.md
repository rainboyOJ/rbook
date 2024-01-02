---
title: Brute Force
author: rainboy
update_time : 2023-09-05
---

# Brute Force|BF算法

`brute`表示蛮力,`force`这里指的力量,所以$Brute\ Force$这里指的是使用暴力,蛮力来解决字符串的匹配问题.


## 问题

有两个字符串,一个我们称为源(source)串$s$,另一个我们称为我匹配串(pattern)`p`,问`p`能否在`s`中找到匹配的子串,如果可以输出在`s`中第一次匹配的位置,否则输出$-1$


很容易就想到,如果`s[i-1]`与`p`的前$j-1$元素相同,也就是如图:

现在比较到`s[i]`与`p[j]`是否相同,有两种情况

- `s[i]`与`p[j]`相同,那就继续比较`s[i+1]`与`p[j+1]`


- `s[i]`与`p[j]`不相同,失配了,这个时间应该从`s[i-j+1]`


Q: 为什么是`s[i-j+1]`呢?

因为它是`s[i-j]`的后一个位置,而`i-j`,不就是第i个位置的前`j+1`个位置,包含i所得到的值吗?

## 解决问题的代码

```cpp
<%-include("./code_solve.cpp")%>
```
## 时间复杂度

在最坏的情况下`s`的长度$n$,`p`的长度为$m$,那么从s的每一个位置开始都要比较m次,时间为`n*m`

## 代码模板

```cpp
<%-include("./template.cpp")%>
```

## 更容易的写法

BF算法其时很简单,是一个暴力算法,如果用二重循环来写的话,可以这样写

```cpp
<%-include("./2d-for.cpp")%>
```

时间复杂度是一样的,且更容易理解

## 总结

BF算法 在主串和字串匹配失败时，主串进行的回溯操作会影响效率，回溯之后，主串与字串有些部分比较是没有必要的。这种简单的丢弃前面的匹配信息是 BF算法 之所以效率低效的一个重要因素。

后面我们会学习KMP算法,很好的解决了这失配后的操作
