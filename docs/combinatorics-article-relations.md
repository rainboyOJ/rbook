# 组合计数文章的学习关系

本次梳理覆盖 `book/enumeration_permutaion_combination/` 的菜单文章，以及数学章的组合数学、容斥原理，并核对它们直接使用的集合、递归、二进制、栈、余数与素数知识。

## 关系的含义

- 关系图读取文章 front matter 的 `rbook.pre`，方向为“前置文章 → 当前文章”。只记录直接的学习前置。
- 正文使用 `[[[rbook: id]]]` 说明模型对应、应用与延伸；这些链接不自动生成前置边。
- 不以同属一个章节为由连线，不要求把整组文章排成一条阅读链。
- 保持现有文章 ID，包括原来由目录名推导出的 ID。本次不调整目录结构和发布范围。

## 直接前置与理由

| 文章 ID | 直接前置 ID | 正文中的依据 |
| --- | --- | --- |
| `rule_of_sum` | `set` | 用集合的元素个数与互不重叠的分类表示加法计数 |
| `rule_of_product` | `set` | 用有序对组成的方案集合表示分步选择 |
| `pair_number` | `rule_of_sum` | 先按右端点分类；组合数、乘法与容斥只作正文对照 |
| `01_seq` | `recursion`, `rule_of_product` | 递归生成每个位置的选择，并解释方案数 |
| `ball_and_box` | `01_seq` | 将每层的两个选项扩展成当前可用球的选择 |
| `full_permutation` | `ball_and_box` | 具体实现不同球放入不同位置的枚举 |
| `not_repeat_permutation` | `full_permutation` | 在已会普通排列回溯后，处理同值元素重复 |
| `non_recursive_permutation` | `full_permutation` | 改用字典序生成同一个排列集合 |
| `subset_enum` | `ball_and_box`, `binary` | 对照任意个数的选择，并用二进制掩码表示子集 |
| `stack_seq` | `stack`, `recursion` | 从合法栈操作的递归枚举入手，Catalan 公式是后续路线 |
| `combinatorics` | `rule_of_sum`, `rule_of_product` | 在分类与分步计数基础上整理排列组合公式 |
| `inclusion-exclusion` | `rule_of_sum` | 从互斥分类转向重叠分类的修正；组合数不是概念前置 |
| `combinatorics_tricks` | `combinatorics` | 隔板位置的选择需要组合数 |
| `catalan_number` | `combinatorics` | 从全部括号序列的组合数计数进入合法性限制 |
| `generating_function` | `combinatorics` | 当前笔记将指数生成函数用于多重集排列 |
| `lucas` | `combinatorics`, `remainder`, `prime` | 组合数、同余运算及素数模数条件 |

集合保留为基础节点，不为连通图而添加前置。递归、二进制、栈、余数、素数的已有前置声明不变。

移除两条传递重复边：`set → pair_number` 已由 `set → rule_of_sum → pair_number` 覆盖；`01_seq → subset_enum` 已由 `01_seq → ball_and_box → subset_enum` 覆盖。正文仍保留直接的知识回顾链接。

## 正文中的模型联系

- 黑白气球连接分类加法、组合数和乘法原理；将其补集计数与需要交集修正的容斥区别开。
- 01 序列、球盒枚举、子集掩码与排列组合公式互相对照，区分生成方案和只计算数量。
- 出栈序列与合法括号建立对应，链接 Catalan 数；不把 Catalan 数强加为开始模拟栈操作的前置。
- 球盒模型与隔板法对应相同球分配问题；多个违规条件重叠时链接容斥。
- 生成函数与 Lucas 的比较系数思路作为补充路线，未建立彼此的前置边。

## 后续正文校订记录

以下为阅读时发现的已有问题。本次只补关系、导航与失效的文章跳转，没有修改这些公式、证明或代码，也不表示这些草稿已经补完。

| 位置 | 已有问题 |
| --- | --- |
| `book/math/set/index.md`，集合的关系 | 子集与真子集符号的说明混淆；真子集条件中出现了同时属于和不属于同一集合的表述 |
| `book/math/combinatorics/rule_of_sum/index.md` | “不重”和“不漏”的条件解释混淆，需要分别对应两两不交与覆盖全部方案 |
| `book/math/combinatorics/rule_of_product/index.md` | 把两个选择集合不相交写成乘法原理的必要条件，需按有序对模型重述 |
| `book/enumeration_permutaion_combination/01_sequence/index.md`，解析 | 一般方案数仍写作字面代码 `2^2`，应在正文校订时统一为变量规模下的公式 |
| `book/enumeration_permutaion_combination/ball_and_box/index.md` | 首个例子的盒子数量与表格不一致；全组合示例的函数调用名称不一致；整数可零划分末尾组合数参数顺序有误 |
| `book/math/combinatorics/tricks/隔板法.md` | 隔板法公式的上下标及变量含义混乱；部分数学标记未闭合，需统一球数和盒子数后重写 |
| `book/enumeration_permutaion_combination/permutation/not_repeat_permutation/index.md` | 证明尚有问句草稿，公式中的 `\geslant` 不是有效的 KaTeX 命令 |
| `book/math/combinatorics/catalan_number/index.md` | 递推式与闭式的下标约定不一致，按现有递推得到的第二项与闭式不符 |
| `book/math/inclusion-exclusion/index.md` | 一般公式中集合总数、求和变量及交集下标混用，需统一记号并补证明 |
| `book/math/combinatorics/lucas/index.md` | 原文仍保留比较系数步骤的证明疑问，本次导航未补足证明 |
| `book/math/combinatorics/generating_function/index.md` | 当前只有主题提示与参考资料，尚不是完整教程 |
