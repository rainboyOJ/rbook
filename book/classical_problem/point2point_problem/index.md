---
title: 点对问题
status: TODO
---


## 描述

点对问题`f(n)`: 问一个序列符合条件的点对有多少对.例如逆序对问

设``s(i)``表示以``i``点为结尾的符合点对的数量,那么

```math
f(n) = \sum_{i=1}^{n}s(i)
```

- 如果``s(i)``的时间为`O(1)`,那总时间为`O(n)`
- 如果``s(i)``的时间为`O(logn)`,那总时间为`O(nlogn)`

## 经典问题


- 逆序对
- 差值对 ,序列是任意差值``<= val``的对数,可以排序
- 筛选差值对,序列是任意差值``<= val``的对数对应颜色数,可以排序
- 选择客栈
- 树上点对(点分治)
  - 8002 树上点对1-红蓝颜色对 TODO
  - 8003 树上点对2-大小对 TODO
  - 树上差值对: POJ1741
