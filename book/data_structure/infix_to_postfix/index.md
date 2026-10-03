---
title: 中缀表达式转后缀表达式
---

## 为什么要转换表达式

我们平时写的是中缀表达式：运算符写在两个操作数中间，例如
`A + B * C`。这种写法适合人阅读，但计算机必须根据优先级、结合性和括号来决定运算顺序。

后缀表达式（也叫逆波兰表达式）把运算符写在操作数后面，例如：

```text
A + B * C  ->  A B C * +
```

后缀表达式不需要括号。扫描它时，遇到操作数就入栈，遇到运算符就取出栈顶的两个操作数计算，因此非常适合用栈求值。

中缀转后缀的核心方法只有一句话：

> 操作数直接输出，运算符暂存在栈中；当栈顶运算符应该先计算时，就把它弹出输出。

## 运算符的优先级和结合性

本文先讨论二元运算符 `+`、`-`、`*`、`/`、`^`。优先级越大，越应该先计算。

| 运算符 | 优先级 | 结合性 |
| --- | ---: | --- |
| `+`、`-` | 1 | 左结合 |
| `*`、`/` | 2 | 左结合 |
| `^` | 3 | 右结合 |

左结合表示同一优先级从左向右计算，例如 `8 / 4 / 2` 等价于 `(8 / 4) / 2`。
右结合表示从右向左计算，例如 `2 ^ 3 ^ 2` 等价于 `2 ^ (3 ^ 2)`。

因此，处理当前运算符 `op` 时：

- `op` 是左结合：栈顶优先级大于或等于 `op` 时弹栈；
- `op` 是右结合：栈顶优先级严格大于 `op` 时弹栈。

左括号是一个边界。它可以压入栈，但不能参与普通的优先级比较。

## 调度场算法

从左到右扫描表达式，并维护两个序列：输出序列和运算符栈。

### 遇到操作数

数字、变量名等操作数直接追加到输出序列。若操作数可能有多位，应该先把表达式切分成 token，不能按单个字符处理。

### 遇到左括号

左括号直接入栈。它表示一个新的局部表达式范围。

### 遇到右括号

不断弹出并输出栈顶运算符，直到遇到左括号。弹出左括号后丢弃它，不把括号写入后缀表达式。

### 遇到运算符

根据当前运算符的结合性比较优先级，并重复弹出栈顶运算符：

```text
左结合：栈顶优先级 >= 当前优先级
右结合：栈顶优先级 >  当前优先级
```

遇到左括号时停止弹栈，然后把当前运算符压入栈。

### 扫描结束

表达式扫描完后，依次弹出栈中剩余的运算符并追加到输出序列。若此时仍遇到左括号，说明原表达式的括号不匹配。

## 例子：`A + B * C`

| 扫描内容 | 运算符栈 | 输出 |
| --- | --- | --- |
| `A` | 空 | `A` |
| `+` | `+` | `A` |
| `B` | `+` | `A B` |
| `*` | `+ *` | `A B` |
| `C` | `+ *` | `A B C` |
| 结束 | 空 | `A B C * +` |

所以：

```text
A + B * C  ->  A B C * +
```

处理 `*` 时，栈顶是 `+`，`*` 的优先级更高，因此 `+` 不能弹出。结束时先弹出 `*`，再弹出 `+`，这就保留了乘法优先于加法的规则。

## 例子：括号如何改变顺序

转换 `(2 + 3 * (8 - 4)) / 5`：

```text
2 3 8 4 - * + 5 /
```

可以从后缀表达式看出计算顺序：先计算 `8 - 4`，再与 `3` 相乘，然后加上 `2`，最后除以 `5`。

## C++ 实现

下面的实现接收已经切分好的 token，因此可以正确处理多位整数和变量名。token 之间用空格分隔，输出也用空格分隔。

```cpp
#include <cctype>
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

using namespace std;

bool isOperator(const string& token) {
    return token == "+" || token == "-" || token == "*" ||
           token == "/" || token == "^";
}

int precedence(const string& op) {
    if (op == "+" || op == "-") return 1;
    if (op == "*" || op == "/") return 2;
    if (op == "^") return 3;
    return -1;
}

bool isRightAssociative(const string& op) {
    return op == "^";
}

bool shouldPop(const string& top, const string& current) {
    if (top == "(") return false;
    int topPriority = precedence(top);
    int currentPriority = precedence(current);
    if (isRightAssociative(current)) {
        return topPriority > currentPriority;
    }
    return topPriority >= currentPriority;
}

vector<string> infixToPostfix(const vector<string>& tokens) {
    vector<string> operators;
    vector<string> postfix;

    for (const string& token : tokens) {
        if (!isOperator(token) && token != "(" && token != ")") {
            postfix.push_back(token);
        } else if (token == "(") {
            operators.push_back(token);
        } else if (token == ")") {
            while (!operators.empty() && operators.back() != "(") {
                postfix.push_back(operators.back());
                operators.pop_back();
            }
            if (operators.empty()) {
                throw invalid_argument("右括号没有匹配的左括号");
            }
            operators.pop_back(); // 丢弃左括号
        } else {
            while (!operators.empty() &&
                   shouldPop(operators.back(), token)) {
                postfix.push_back(operators.back());
                operators.pop_back();
            }
            operators.push_back(token);
        }
    }

    while (!operators.empty()) {
        if (operators.back() == "(") {
            throw invalid_argument("左括号没有匹配的右括号");
        }
        postfix.push_back(operators.back());
        operators.pop_back();
    }
    return postfix;
}

int main() {
    vector<string> tokens = {"(", "2", "+", "3", "*", "(",
                             "8", "-", "4", ")", ")", "/", "5"};
    for (const string& token : infixToPostfix(tokens)) {
        cout << token << ' ';
    }
    cout << '\n';
}
```

代码中的 `shouldPop` 是整个算法的关键。它把“左结合时大于等于、右结合时严格大于”集中在一个地方处理，避免把 `^` 错误地当成左结合运算符。

## 两个容易忽略的问题

### 多位数字必须先分词

如果逐字符扫描，`123 + 45` 会被当成 `1 2 3 + 4 5`。实际实现通常先做词法分析，把它切成：

```text
123  +  45
```

然后再把 token 交给调度场算法。

### 一元负号需要单独识别

`-` 既可能是二元减法，也可能是一元负号。若 `-` 位于表达式开头、左括号后或另一个运算符后，它通常是一元运算符，例如 `-3`、`2 * (-4)`。

最简单的做法是词法分析时把它改写成一个带名字的运算符（例如 `neg`），为它设置优先级和结合性；也可以先把 `-3` 识别成一个完整的负数 token。不能直接把所有 `-` 都按二元减法处理。

## 复杂度与本质

每个 token 最多入栈一次、出栈一次，因此时间复杂度是 $O(n)$，运算符栈的空间复杂度是 $O(n)$。

调度场算法的本质，是把“运算符应该等待多久”交给栈管理：优先级较低的运算符留在栈中等待，已经确定应该先计算的运算符立即弹出。括号把表达式切成局部范围，结合性则决定同优先级运算符是否应该弹栈。

完成转换后，后缀表达式可以直接交给另一个栈求值算法处理，这也是表达式解析中“转换”和“计算”可以分开的原因。
