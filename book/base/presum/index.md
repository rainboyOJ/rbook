
## 描述


求不修改的序列的区间和问题,可以使用**前缀和**思想

设:
$$
S_i = \sum_{j=1}^i a_j = a_1 + a_2 + \cdots +a_i
$$

所以$S_i$表示前$i$个元素的累加和,称为前缀和.

可以想到

$$
\begin{align}
    S_i = S_{i-1} + a_i \\
    a_i = S_i - S_{i-1}
\end{align}
$$

同样,可以想到,如果想到求$a_3+a_4+a_5$的和,也就是区间$[3,5]$的区间和,只需要知道$S_2$和$S_5$即可

$$
a_3+a_4 + a_5 = S_5 - S_2
$$

同理,区间$[l,r],l \leqslant r$的区间和就是:

$$
\sum_{i=l}^r a_i = S_r - S_{l-1}
$$

代码模板如下

```cpp
<%- include("/algo_template/base/presum.cpp")%>
```

## 题目列表


- <%- pid_to_url('luogu', '8218','【深进1.例1】求区间和') %>
- luogu P1719 二维前缀和