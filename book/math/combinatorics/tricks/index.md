---
title: 技巧
rbook:
  id: combinatorics_tricks
  pre:
    - combinatorics
  status: TODO
  comment: 应该修改隔板的描述,增加画图
---

[[TOC]]

## 阅读路线

先掌握 [[[rbook: combinatorics]]] 中“从若干位置选择隔板位置”的组合数计数。本文的模型是相同的球放入不同盒子；盒子是否允许为空，会改变需要建立的对应关系。

想从实际分配过程观察这个模型，可以对照 [[[rbook: ball_and_box]]] 中的整数划分部分。若分配问题还带有多个可能重叠的违规条件，可以进一步考虑 [[[rbook: inclusion-exclusion]]]。

[[[include: ./隔板法.md]]]
