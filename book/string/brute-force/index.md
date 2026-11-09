---
title: 字符串朴素匹配
menu_title: 朴素匹配
rbook:
  id: string-brute-force
  code_template:
    - title: 朴素匹配（C++）
      tags: [string, brute_force_match]
      desc: 字符串朴素匹配的实现
      code: ./code/brute_force_match.cpp
    - title: 朴素匹配（Python）
      tags: [string, brute_force_match , python]
      desc: 字符串朴素匹配的实现
      code: ./code/brute_force_match.py
---

[[TOC]]

## 一句话算法

朴素匹配就是枚举主串中的每个起点，然后从左到右尝试把模式串完整贴上去。

## 问题模型

给定两个字符串：

- 主串 `text`，长度为 $n$；
- 模式串 `pattern`，长度为 $m$。

要求找出 `pattern` 在 `text` 中出现的所有起始位置。如果只关心第一次出现，返回第一个位置即可。

例如：

```text
text    = abababaca
pattern = aba
```

`pattern` 在 `text` 中从位置 `0`、`2` 和 `4` 开始出现。

## 核心直觉

把模式串想成一把长度为 $m$ 的尺子。

我们把尺子依次放在 `text` 的每个可能起点：

```text
text:    a b a b a b a c a
pattern: a b a
         ^

text:    a b a b a b a c a
pattern:   a b a
           ^
```

每放一次，就逐字符比较：

- 全部相等：这个起点是一次匹配。
- 中途不同：这个起点失败，换下一个起点。

朴素匹配不保存任何失配信息，所以失败后只能把起点右移一格。

## 算法步骤

1. 枚举起点 `start = 0, 1, ..., n - m`。
2. 从 `pattern[0]` 开始逐字符比较。
3. 若 `text[start + j] == pattern[j]`，继续比较下一位。
4. 若出现不相等，当前起点失败。
5. 若比较完 $m$ 个字符都相等，记录 `start`。

## 算法证明

**核心不变量**：外层循环枚举过的每一个起点，都已经被完整判断过“能不能匹配”。

1. 对固定起点 `start`，算法逐一比较：

   $$
   text[start+j]\quad \text{和}\quad pattern[j]
   $$

   其中 $0\le j<m$。

2. 如果某个 $j$ 不相等，那么根据字符串相等的定义，当前位置不可能是一次匹配。

3. 如果所有 $j$ 都相等，则：

   $$
   text[start,start+m-1] = pattern[0,m-1]
   $$

   所以 `start` 必然是一次匹配。

4. 外层循环覆盖了所有可能起点 $0$ 到 $n-m$。

因此算法能找出所有匹配位置。

## 复杂度分析

- 时间复杂度：最坏 $O(nm)$。
- 空间复杂度：除输出数组外为 $O(1)$。

最坏情况常见于大量前缀相同、最后一位才失配的字符串，例如：

```text
text    = aaaaaaaaaab
pattern = aaaab
```

## 代码实现

```cpp [g1:C++] file=./code/brute_force_match.cpp
```

```py [g1:Python] file=./code/brute_force_match.py
```
Python 模板文件也包含命令行入口，可直接运行；输入输出与 C++ 相同。

## 测试用例

输入：

```text
abababaca aba
```

输出：

```text
0 2 4
```

解释：`aba` 分别从下标 `0`、`2`、`4` 开始出现。

## 应用分类详解

朴素匹配的本质是：不做预处理，不保存失配信息，直接检查每一个候选起点。它适合规模小、实现成本要极低、或作为更高级字符串算法的对照基线。

### 一、小数据字符串查找

**典型模式：** $n,m$ 很小，或者测试次数很少。

**识别信号：** 数据范围只有几百、几千，题目重点不在字符串算法本身。

**核心建模：** 直接枚举每个起点并逐字符验证。

| 应用场景 | 经典题目 | 核心思路 |
|---|---|---|
| 判断子串是否出现 | [LeetCode 28](https://leetcode.cn/problems/find-the-index-of-the-first-occurrence-in-a-string/) | 小数据可直接暴力 |
| 枚举固定模板 | [[[p: luogu-P1308]]] | 先统一大小写和边界，再顺序扫描 |

### 二、二维或特殊形态匹配的起点枚举

**典型模式：** 需要在网格、矩阵、棋盘上寻找某个形状。

**识别信号：** 出现“从每个格子出发”“八个方向”“匹配一个单词或图案”。

**核心建模：** 外层枚举起点，内层按方向或形状逐项检查。

| 应用场景 | 经典题目 | 核心思路 |
|---|---|---|
| 网格单词搜索 | [LeetCode 79](https://leetcode.cn/problems/word-search/) | 起点枚举加 DFS |
| 八方向单词匹配 | [[[p: luogu-P1101]]] | 枚举起点和方向 |

### 三、高级算法的对照基线

**典型模式：** 需要理解 KMP、哈希、AC 自动机为什么更快。

**识别信号：** 题目讨论“失配后如何移动”“多模式匹配”“大量查询”。

**核心建模：** 朴素匹配每次失配都会丢掉已经比较过的信息，高级算法的价值就在于复用这些信息。

| 应用场景 | 经典题目 | 核心思路 |
|---|---|---|
| KMP 入门前置 | [[[p: luogu-P3375]]] | 先理解暴力失配为什么慢 |
| 字符串哈希对照 | [[[p: luogu-P3370]]] | 暴力比较可作为小数据校验 |

## 经典例题

### 1. [LeetCode 28](https://leetcode.cn/problems/find-the-index-of-the-first-occurrence-in-a-string/)

要求返回模式串第一次出现的位置。朴素匹配是最直接做法，也是理解 KMP 前必须掌握的基线。

### 2. [[[p: luogu-P1308]]]

统计一个单词在文章中出现的次数，并要求匹配完整单词。重点不在字符串匹配算法，而在大小写和单词边界处理。

### 3. [[[p: luogu-P1101]]]

在字符矩阵中寻找固定单词。虽然不是一维字符串，但核心仍然是“枚举起点，再检查模式”。

## 参考

- 旧版文章：`Rbook_ejs_old/book/string/brute-force/index.md`
- 后续学习：KMP 算法会复用失配前的信息，避免文本指针回头。
