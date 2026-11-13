---
title: 全排列
status: TODO
rbook:
  id: full_permutation
  pre:
    - ball_and_box
---

[[toc]]

## 阅读路线

先理解 [[[rbook: ball_and_box]]] 中“不同球放入不同位置”的模型。本文把每个位置依次选择一个尚未使用的元素，并通过回溯恢复可选状态。

元素有重复时，需要在 [[[rbook: not_repeat_permutation]]] 中重新处理重复方案；若想按字典序依次生成排列，可以继续看 [[[rbook: non_recursive_permutation]]]。只计算方案数而不输出方案时，对照 [[[rbook: combinatorics]]] 中的排列公式。

## 题目

[[[include: ./problem.md]]]

## 解析

[[[include: ./full_permutation.md]]]
