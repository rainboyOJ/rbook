# 孤儿文件收编待办（todo_allow_list）

来源：`tests/orphan-allowlist.json` 里登记的 73 个 md。
判定依据：**内容是否成型**（字节数 / 代码块 / 图 / TODO 密度）+ **是否填补 catalog 的真实缺口** + **是否有重复或模板残留**。

> 全部 73 项都已在下方分档。T1/T2 是我认为**值得进电子书**的，T4 需要先补写，T5 建议直接删。

## 一句话结论

最值钱的是**三个整章缺口**：`字符串`（KMP/BF 已成型）、`并查集`（种类并查集已成型）、
以及 `基础` 里的**三分**、`组合数学`里的**容斥**、`背包`里的**分组背包** —— 这 6 篇内容是写好的，
只差挂进 catalog。其余多为附录、草稿或空占位。

---

## T1 核心缺口｜内容已成型，建议优先收编

| # | 文件 | 体量 | 填补的空缺 | 现状 / 需要做的事 |
|---|---|---|---|---|
| 1 | `string/kmp/index.md` | 3.2KB / 4 代码块 | **`字符串`整章 catalog 完全没有** | 内容很实（next 数组递归推导 + 匹配代码）。需：① 修掉指向不存在的 `![[…kmp_next.svg]]` 图引用；② 补 1 处 `TODO` 代码块 |
| 2 | `string/brute-force/index.md` | 879B / 3 代码块 | 同上，且是 KMP 的前置 | **内容完整**，3 个 .cpp 引用文件都在。可直接作为 `字符串` 章第一篇 |
| 3 | `data_structure/disjoint_set/种类并查集.md` | 565B | **`并查集`整节 catalog 没有** | 二分图染色 → 种类并查集，讲法清楚。可与 `disjoint_set/index.md` 合成一节的「首页 + 子页」 |
| 4 | `base/tri-search/index.md` | 805B | **三分算法完全缺失** | 原理 + 整数域写法都在，`status: TODO` 但可用。建议补一段完整代码 |
| 5 | `math/inclusion-exclusion/index.md` | 1.3KB / 2 图 | **容斥原理**（combinatorics 下没有） | 定义 + 一般公式 + 2/3 集合特例 + 图，内容成型；「证明」小节是空的 |
| 6 | `dynamic_programming/knapsack/grouped_knapsack/index.md` | 3.0KB / 9 代码块 | **分组背包**（catalog 背包下只有 01 / 完全） | 内容最扎实的一篇（三维→二维→一维推导 + 图解 + 例题数据）。需：① 去掉 VitePress 的 `<script setup>` / `<gallery>` 标签，改成普通 `<img>`；② `asym/` 下 svg 与 `template.cpp`/`in.txt` 都在 |

## T2 重要内容｜需少量整理（补 include、清 TODO、修引用）

| # | 文件 | 体量 | 说明 | 需要做的事 |
|---|---|---|---|---|
| 7 | `preface.md` | 1.9KB / 111 行 | **全书的「序」**：写作背景、如何阅读本书（比赛型/非比赛型代码）、推荐书单、配套工具 | 结构完整（结尾有「联系作者」），但 `## 写作背景` 是空的、第 58 行起有一整段标着 `draft:` 的草稿（含「我和大家一样把难度划分成…」），需要删或降级为注释；挂到「前言」章 |
| 8 | `base/binary_jump/倍增思想.md` | 1.9KB | 倍增思想（ST 表 / DP 优化 / 线段树的基础） | `binary_jump/index.md` 只 include 了 `template.cpp`，**这篇没被 include**，加一行 `[[[include: ./倍增思想.md]]]` 即可 |
| 9 | `enumeration_permutaion_combination/ball_and_box/stirling_number.md` | 2.3KB | **第二类斯特林数**（球不同盒相同不可空） | 推导 + 验证过程 + 代码，质量好；挂成 `ball_and_box` 的子页 |
| 10 | `data_structure/split_chunk/start.md` | 3.8KB / 3 代码块 | 分块入门（A Simple Problem with Integers） | 与已发布的 `block_data/decompose`（讲均值不等式/分块理论）**互补不重复**，可作块状数据的实战篇 |
| 11 | `math/numberTheory/index.md` | 2.5KB | 数论章总览（素数筛 / 欧拉筛 / 质因数分解，带完整代码） | 作为「数论」章首页；注意里面代码有笔误（`primes[i] > n/i`、`if( i % primes[j] ) break` 两处疑似写反） |
| 12 | `data_structure/dance_linking/start.md` | 378B / 1 代码块 | 舞蹈链 DLX（精确覆盖） | 骨架完整（原理 + 2 图 + `dlx_template.cpp`），补正文 |
| 13 | `math/一一映射.md` | 371B | 一一映射技术（计数 DP 的基础工具，`模板题目.md` 引用了它） | 内容成型，可直接收 |
| 14 | `recursion/combination.md` | 1.6KB / 4 代码块 | Gosper's Hack 枚举 $k$ 元子集 | 推导 + 可运行示例 + 输出，内容完整 |
| 15 | `sort/quicksort/index.md` | 663B / 2 代码块 | **`排序`整章 catalog 没有** | 有正确性证明的讨论，但很口语、`TODO` 多、`file=` 缺 lang。建议重写一遍再收 |
| 16 | `math/numberTheory/欧其里德定理及推论.md` | 523B | 素数无穷 + 推论 | 内容成型，可挂 `numberTheory` 下 |
| 17 | `math/combinatorics/模板题目.md` | 1.5KB | 球盒模型习题（球不同盒不同 / 盒相同） | 内容实，1 处 `TODO`（写暴力枚举程序）；作为 combinatorics 的习题页 |
| 18 | `tricks/fraction_class.md` | 254B / 1 代码块 | 分数类模板（避免 double 精度问题） | 短小实用，代码块语法正常；末尾「想一想：为什么无穷大/无穷小的分数类是这么创建的」是个开放问题 |
| 19 | `tricks/quick_swap_two_range.md` | 268B | 三次 reverse 快速交换两区间 | 短小但完整 |
| 20 | `greedy/delete_number/index.md` | 178B | 删数问题（贪心） | 思路 + 证明骨架，`greedy` 章可收 |
| 21 | `data_structure/disjoint_set/index.md` | 58B | **`并查集`整节首页**（「并查集能维护连通性 / 擅长动态维护传递性」） | 只是「记忆点」两行，需与 `种类并查集.md` 组成一节（首页 + 子页），补上普通并查集的内容 |
| 22 | `mind_theory/index.md` | 74B | **解题方法论**（缩小放大法 / 归纳法 / 反证法） | 全书多处引用「缩小放大法」（mst、stirling_number），但本篇只有 3 个标题。**价值高、内容最缺**，值得单独写成一章 |
| 23 | `string/trie/index.md` | 303B | Trie 字典树 | 只有性质/功能清单（`status: TODO`），补实现后可收 |
| 24 | `string/index.md` | 9B | `字符串`章的首页 | 只有一句「字符串相关的算法」，需写导语 |

## T3 附录 / 工具 / 趣味｜短小实用，随附录一起收

| # | 文件 | 体量 | 说明 |
|---|---|---|---|
| 25 | `appendix/cpp工具.md` | 1.5KB | 在线编译器、godbolt、cppinsights、Dev-C++ 分支等清单，实用 |
| 26 | `appendix/创建模板库.md` | 1.1KB / 3 代码块 | 用 `bat`+`fzf`+`xsel` 脚本管理个人代码模板库 |
| 27 | `appendix/常用数学公式.md` | 559B / 3 代码块 | 公式速查（log 次数、等差/等比、排列组合），有骨架待补 |
| 28 | `appendix/template/index.md` | 42B | 代码模板入口（```` ```cpp file=./template.cpp ````） |
| 29 | `appendix/math/short-story/负负得正.md` | 1.3KB | 数学小故事：用记账引出负数（LaTeX 本次已修） |
| 30 | `appendix/math/short-story/什么情况下改变任意一个操作数的位置不影响结果.md` | 1.3KB | 结合律的趣味证明（LaTeX 本次已修） |
| 31 | `appendix/ubuntu2204系统的安装.md` | 233B | 环境安装 |
| 32 | `appendix/noilinux2.0的安装.md` | 234B | 环境安装 |
| 33 | `classical_problem/point2point_problem/index.md` | 407B | 点对问题（`status: TODO`，3 处 TODO） |
| 34 | `problem_list/super_total/index.md` | 470B | 超级综合题单，可挂进「题单」章 |
| 35 | `enumeration_permutaion_combination/permutation/类循环排列.md` | 302B | 类循环排列（有题面，2 处 TODO） |
| 36 | `dynamic_programming/Quadrangle_Inequality_Optimization/poetG/index.md` | 294B | 四边形不等式例题（挂在已发布章节下的子页） |
| 37 | `algorithm/dsu_on_tree/index.md` | 201B | 树上启发式合并（简述 + 复杂度直觉） |
| 38 | `data_structure/binary_search_tree/index.md` | 1.6KB | BST 定义/性质/操作。**注意：混入了 ChatGPT 对话残留**（「你的总结完全正确，而且非常到位！」「要不要我们用一个具体的二叉搜索树例子…」），必须清理后才能发布 |

## T4 目前只是大纲 / 草稿｜要先补写

| # | 文件 | 体量 | 问题 |
|---|---|---|---|
| 39 | `data_structure/splay/index.md` | 367B | 只有核心概念清单，`status: TODO`。平衡树整块缺口，值得写 |
| 40 | `data_structure/treap/index.md` | 100B | 明确写着「这里是草稿，需要结合 rbook_old 上的 treap 查看」——基本空壳 |
| 41 | `ReadingNotes/preface.md` | 155B | 读书笔记总前言（4 行） |
| 42 | `ReadingNotes/近世代数/chapter_1.md` | 451B | 近世代数第一章，内容很少 |
| 43 | `ReadingNotes/近世代数/preface.md` | 73B | 只有书目/视频链接 |
| 44 | `base/number_dis/start.md` | 783B | 「数字距离」，2 张 `asym/*.svg` 图缺失 |
| 45 | `recursion/dynamic_loop/index.md` | 99B | 递归实现多重循环；引用了不存在的绝对路径 `/algo_template/enumerate/递归实现多重循环.cpp` |
| 46 | `string/minimal-string/index.md` | 307B | 只有参考链接 |
| 47 | `string/Boyer-Moore/index.md` | 50B | 只有一个参考链接 |
| 48 | `appendix/math/数学小故事-根号是无理数.md` | 810B | **语音转文字产物**，通篇「呃…这个…」，语句不通，需重写 |
| 49 | `appendix/program_environment/readme.md` | 95B | 环境配置总览（只有 bullet 清单） |
| 50 | `appendix/有用的资料.md` | 74B | 只有 1 个链接 |
| 51 | `appendix/软件.md` | 77B | 只有一段 `xfce4-terminal` 的说明 |

## T5 建议删除或合并｜空文件 / 模板残留 / 重复目录

**空文件（0 字节，纯占位）— 13 个**

| 文件 | 判断 |
|---|---|
| `base/bigNumber/div.md` | `bigNumber/index.md` 只 include 了 `add.md`，这三篇是空占位：要么写，要么删 |
| `base/bigNumber/mul.md` | 同上 |
| `base/bigNumber/sub.md` | 同上 |
| `enumeration_permutaion_combination/combination/全组合.md` | `combination/` 下 4 篇全空 |
| `enumeration_permutaion_combination/combination/不重复组合.md` | 同上 |
| `enumeration_permutaion_combination/combination/二进制法实现组合.md` | 同上 |
| `enumeration_permutaion_combination/combination/normal/一般组合.md` | 同上 |
| `recursion/binary_search/区间划分最值问题.md` | `binary_search/` 下 3 篇子页全空 |
| `recursion/binary_search/可二分性定区间问题.md` | 同上 |
| `recursion/binary_search/有序集上的操作.md` | 同上 |
| `dynamic_programming/Quadrangle_Inequality_Optimization/stone_merge/index.md` | 空 |
| `problem_list/noip_csp_junior/index.md` | 空题单 |
| `problem_list/noip_csp_senior/index.md` | 空题单 |

**模板残留 / 重复 / 只有链接 — 建议删或并**

| 文件 | 建议 |
|---|---|
| `about.md` | **Vitesse 模板自带的示例页**（讲的是 Vite/Vue starter），完全不是本书内容 → 删 |
| `algorithm/binary_search/index.md` | 与已发布的 `recursion/binary_search/` 重复（旧目录） → 删 |
| `algorithm/discrete/start.md` | 与已发布的 `base/discrete` 重复（旧目录） → 删 |
| `math/combinatorics/Inclusion–exclusion_principle.md` | 空文件，且与 T1 的 `math/inclusion-exclusion/` 重复 → 删 |
| `math/numberTheory/exgcd/index.md` | 只有 4 个标题，无内容；扩展欧几里得是好题材，但现状等于空 → 先补写 |
| `math/numberTheory/约数/index.md` | 只有 3 个外链 → 先补写 |
| `math/排序不等式.md` | 只有 1 个百度百科链接 → 先补写 |
| `data_structure/segment_tree/other.md` | 30 字节的一句备忘（线段树分裂/优化建图/矩阵优化 DP） → 并入「线段树」章的待办，或删 |
| `appendix/program_environment/noilinux2.0/myos.md` | 正文就是「TODO」 → 删或写 |

---

## 汇总

| 档位 | 数量 | 含义 |
|---|---|---|
| T1 核心缺口 | 6 | 内容已成型，只差挂进 catalog —— **最该先做** |
| T2 重要内容 | 18 | 补 include / 清 TODO / 修引用后即可收 |
| T3 附录工具趣味 | 14 | 短小实用，随附录一起收 |
| T4 待补写 | 13 | 只是大纲或草稿 |
| T5 删或并 | 22 | 14 个空文件 + 8 个模板残留/重复/纯链接 |
| **合计** | **73** | |

## 按缺口看的优先顺序（我的建议）

1. **`字符串` 整章**（KMP + BF 已成型，Trie/最小表示法/Boyer-Moore 待写）
2. **`并查集` 整节**（种类并查集已成型）
3. **`base` 补三分**（已成型）
4. **`组合数学` 补容斥**（已成型）
5. **`背包` 补分组背包**（已成型，需去 VitePress 语法）
6. **`preface.md` 全书序**（补完即可）
7. **`mind_theory` 解题方法论**（价值极高但目前最空，需要你亲自写）
8. 其余按上表逐档推进
