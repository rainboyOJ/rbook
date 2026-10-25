## dag

- 背景: 有向图$G$
- $p$: $G$可以进行topsort,
- $q$: 无环

证明: $p \Leftrightarrow q$


## 应用

- 可以用topsort判断是否有环
- 偏序: 见 [[[rbook: dilworth]]]
- dp
  - 求最长路
  - 稳定序

想看拓扑排序一步步把入度为0的点剥出来的过程,试试这个动画:

[[[dsa: topsort]]]

## 模板

```cpp file=./topsort.cpp
```
