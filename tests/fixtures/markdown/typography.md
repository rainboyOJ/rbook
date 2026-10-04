# 排版验证 fixture

这个 fixture 只用于排版（typography）人工与构建检查，
对应计划：`docs/typography-theme-plan.md` 的"排版 fixture 与验收清单"。

## 中文正文

这是一段纯中文正文，用来检查行宽、行高与段落在 42em 正文宽度下的表现。中文排版要求标点不悬挂在行首，且中英文之间有可读的间距。

这是一段中英混排的正文：使用 C++ 与 Python 实现 Binary Search 时，时间复杂度都是 O(log n)，但常数因子不同。行内代码如 `lower_bound` 应与正文有清晰区分。

带行内代码的中文段落：调用 `dp[i] = max(dp[i-1], dp[i-2] + a[i])` 完成转移，复杂度 `O(n)`。

### 标题层级

#### 四级标题

##### 五级标题

###### 六级标题

### 相邻标题

#### 紧跟的三级标题后的四级标题

## 列表

- 无序列表项一
- 无序列表项二
  - 嵌套列表项
- 无序列表项三

1. 有序列表项一
2. 有序列表项二
   1. 嵌套有序列表
3. 有序列表项三

## 引用

> 引用一段中文文字，检查引用的边框、背景和文字层级。
>
> 引用的第二段。

## 表格

| 算法 | 时间复杂度 | 空间复杂度 |
|------|-----------|-----------|
| 快速排序 | O(n log n) | O(log n) |
| 归并排序 | O(n log n) | O(n) |

## 代码块

缩进代码块（正文直接子元素，无行号）：

    indented code block
    second line

普通无语言代码块：

```
plain code block
second line
```

带语言代码块：

```cpp
#include <iostream>
int main() {
    std::cout << "hello" << std::endl;
    return 0;
}
```

带行号的长代码块：

```python
def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + middle + quick_sort(right)
```

长行代码块（横向滚动）：

```python
result = very_long_function_name(argument_one, argument_two, argument_three, argument_four, argument_five, argument_six)
```

## 数学公式

行内公式 $a^2 + b^2 = c^2$ 与块公式：

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$

## 容器组件

::: oneWordAlgo
一句话算法的容器内容。
:::

::: info
信息容器内容。
:::

::: colorfulbox
主题配色标题

这段正文在浅色和暗色主题下都应清晰可读。
:::
