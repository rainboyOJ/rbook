## 入门题目:【模板】单调栈


https://www.luogu.com.cn/problem/P5788

一句话题题目意思:求每个元素$i$后面的第一个大于$a[i]$的第一个位置$j$


朴素的暴力算法是$o(n^2)$,但给的数据范围要求$O(n)$内解决

想一想我们,一个一个读取数据,然后类似插入排序一样,在维护一个有序的序列

```

  +-+
  | |                   x
  | |                  +-+
  | |                  | |
  | |                  | |
  | | +-+              | |
  | | | | +-+          | |
  | | | | | | +-+      | |
  | | | | | | | |      | |
--+-+-+-+-+-+-+-+------+-+--
                       last
```

根据`[[缩小放大法]]`,可以轻易的想到如果序列是一个单调下降的,那么每个一元素没有没有后续的"结果".

再给一个很高的柱子放在最后面,那么前面单调下降的所有的且小于$x$的柱子都应该投影到last柱子上.

那么这些"投影"到last上的柱子就有了答案,就把可以它们去除了,最后变成如图下

```

  +-+
  | | x
  | |+-+
  | || |
  | || |
  | || |
  | || |
  | || |
  | || |
--+-++-+--
     last
```


1. 建立一个栈
2. 栈内准备添加一个位置last,值为x
3. 所有比x小的栈,都出栈,并记录这些点的答案
4. 入栈last

伪代码如下:

::: pseudocode
\begin{algorithm}
\begin{algorithmic}
\STATE Stack mysta;
\STATE int a[maxn];
\STATE int ans[maxn];
\FOR{$i=1$ \TO $n$}
    \WHILE{$ a[mysta.top()] \leqslant a[i]$ \OR \NOT $mysta.empty()$ }
      \STATE ans[mysta.top()] = i;
      \STATE $a.pop()$
    \ENDWHILE
    \STATE $mysta.push(i)$;
\ENDFOR
\FOR{$i=1$ \TO $n$}
    \Print ans[i];
\ENDFOR
\end{algorithmic}
\end{algorithm}
:::


可以想到栈内的元素一定是单调不上升的.


时间负责度: 每个点最后入栈一次,出栈一次,所以时间为$O(n)$

::: oneWordAlgo
核心思想: 去除那些已经得到答案的点,自然形成单调.
:::



### 代码

```c
<%- include("5788.cpp") %>
```
