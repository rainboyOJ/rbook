---
title: 图的遍历
rbook:
  id: graph_traversal
  code_template:
    - title: dfs遍历图
      tags:
        - graph
      code: ./graph_dfs_template.cpp
    - title: 无向图连通分支
      tags:
        - graph
        - connected
      code: ./graph_dfs_find_all_connected_commponent.cpp
---

[[TOC]]

## 模板代码

```cpp file=./graph_dfs_template.cpp
```

找到图所有连通分支,原理:依次从没有被遍历的点开始遍历.

```cpp file=./graph_dfs_find_all_connected_commponent.cpp
```

## 练习

[[[include: ./practice.md]]]
