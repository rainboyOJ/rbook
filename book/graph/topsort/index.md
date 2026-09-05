## dag

- 背景: 有向图$G$
- $p$: $G$可以进行topsort,
- $q$: 无环

证明: $p \Leftrightarrow q$


## 应用

- 可以用topsort判断是否有环
- 偏序
- dp
  - 求最长路
  - 稳定序

## 模板

```cpp
<%- include("./topsort.cpp") %>
```
