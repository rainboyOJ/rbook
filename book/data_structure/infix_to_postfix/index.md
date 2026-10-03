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

- **遇到操作数**：数字、变量名等操作数直接追加到输出序列。若操作数可能有多位，应该先把表达式切分成 token，不能按单个字符处理。
- **遇到左括号**：左括号直接入栈，它表示一个新的局部表达式范围。
- **遇到右括号**：不断弹出并输出栈顶运算符，直到遇到左括号。弹出左括号后丢弃它，不把括号写入后缀表达式。
- **遇到运算符**：根据当前运算符的结合性比较优先级，并重复弹出栈顶运算符：

  ```text
  左结合：栈顶优先级 >= 当前优先级
  右结合：栈顶优先级 >  当前优先级
  ```

  遇到左括号时停止弹栈，然后把当前运算符压入栈。
- **扫描结束**：表达式扫描完后，依次弹出栈中剩余的运算符并追加到输出序列。若此时仍遇到左括号，说明原表达式的括号不匹配。

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
#include <bits/stdc++.h>
using namespace std;

const int maxn = 1e5 + 5;

string op_sta[maxn];   // 运算符栈（手写数组栈）
int sta_top = 0;       // 栈顶指针，指向栈顶元素的下一个位置

// 判断 token 是否是运算符
bool isOperator(const string& token) {
    return token == "+" || token == "-" || token == "*" ||
           token == "/" || token == "^";
}

// 运算符优先级，数字越大优先级越高
int precedence(const string& op) {
    if (op == "+" || op == "-") return 1;
    if (op == "*" || op == "/") return 2;
    if (op == "^") return 3;
    return -1;  // 非运算符
}

// 是否为右结合运算符（只有 ^ 是右结合）
bool isRightAssociative(const string& op) {
    return op == "^";
}

// 栈顶运算符是否应该弹出
// 左结合：栈顶优先级 >= 当前优先级时弹栈
// 右结合：栈顶优先级 >  当前优先级时弹栈（严格大于）
bool shouldPop(const string& top_op, const string& cur_op) {
    if (top_op == "(") return false;      // 左括号是边界，永不参与比较
    int top_p = precedence(top_op);
    int cur_p = precedence(cur_op);
    if (isRightAssociative(cur_op)) {
        return top_p > cur_p;             // 右结合：严格大于才弹
    }
    return top_p >= cur_p;                // 左结合：大于等于就弹
}

// 调度场算法：中缀转后缀，返回后缀表达式的 token 序列
vector<string> infixToPostfix(const vector<string>& tokens) {
    vector<string> postfix;   // 输出序列

    for (const string& token : tokens) {
        if (!isOperator(token) && token != "(" && token != ")") {
            // 操作数：直接输出
            postfix.push_back(token);
        } else if (token == "(") {
            // 左括号：直接入栈
            op_sta[sta_top++] = token;
        } else if (token == ")") {
            // 右括号：弹栈直到遇到左括号
            while (sta_top > 0 && op_sta[sta_top - 1] != "(") {
                postfix.push_back(op_sta[--sta_top]);
            }
            if (sta_top == 0) throw invalid_argument("右括号没有匹配的左括号");
            sta_top--;  // 丢弃左括号
        } else {
            // 运算符：按结合性弹出栈顶优先级更高的运算符
            while (sta_top > 0 && shouldPop(op_sta[sta_top - 1], token)) {
                postfix.push_back(op_sta[--sta_top]);
            }
            op_sta[sta_top++] = token;  // 当前运算符入栈
        }
    }

    // 扫描结束，弹出栈中剩余运算符
    while (sta_top > 0) {
        if (op_sta[sta_top - 1] == "(") {
            throw invalid_argument("左括号没有匹配的右括号");
        }
        postfix.push_back(op_sta[--sta_top]);
    }
    return postfix;
}

int main() {
    vector<string> tokens = {"(", "2", "+", "3", "*", "(",
                             "8", "-", "4", ")", ")", "/", "5"};
    vector<string> postfix = infixToPostfix(tokens);
    for (const string& token : postfix) {
        cout << token << ' ';
    }
    cout << '\n';
}
```

代码中的 `shouldPop` 是整个算法的关键。它把“左结合时大于等于、右结合时严格大于”集中在一个地方处理，避免把 `^` 错误地当成左结合运算符。

## 中缀表达式转表达式树

表达式树是一棵二叉树：

- **叶子结点**存操作数（数字、变量名）；
- **内部结点**存运算符，它的左、右子树分别是该运算符的左右操作数。

例如 `(2 + 3 * (8 - 4)) / 5` 对应的表达式树是：

```text
             /
          /     \
         +       5
       /   \
      2     *
          /   \
         3     -
             /   \
            8     4
```

有了表达式树，后序遍历就能还原出后缀表达式，中序遍历能还原出中缀表达式，表达式求值、求导、化简等操作也都可以在树上完成。

### 为什么要先转后缀

直接从中缀构造表达式树，需要像调度场算法一样同时处理优先级和括号，容易写错。更简单的做法是**分两步**：

1. 先用上一节的调度场算法把中缀转成后缀表达式；
2. 再从后缀表达式构造表达式树。

后缀表达式不含括号，运算符出现的顺序就是它真正参与运算的顺序，所以第二步只需一遍扫描、用一个栈就能完成。

### 后缀表达式建树的规则

从左到右扫描后缀表达式：

- **遇到操作数**：为它新建一个叶子结点，结点编号压入节点栈；
- **遇到运算符**：从节点栈弹出两个结点，**先弹出的是右操作数，后弹出的是左操作数**；用它们作为左右子树新建一个结点，再把新结点压回节点栈。

扫描结束后，栈中剩下的唯一结点就是根。为什么“先弹右、后弹左”？因为后缀表达式的操作数顺序是「左操作数、右操作数、运算符」，入栈顺序也是先左后右，所以弹栈时先弹出的一定是右操作数。

### 代码

下面在上一节基础上补充 `buildExprTree`：输入后缀表达式，返回表达式树的根节点编号。树用数组存储（节点池），`l`/`r` 存左右孩子编号，`0` 表示空孩子。

```cpp
#include <bits/stdc++.h>
using namespace std;

const int maxn = 1e5 + 5;

// 表达式树节点：val 存操作数或运算符，l/r 存左右孩子编号，0 表示空
struct Node {
    string val;
    int l = 0, r = 0;
};

Node tree[maxn];    // 节点池（数组存树）
int node_cnt = 0;   // 已使用节点数

// （此处省略 infixToPostfix、isOperator、precedence 等上一节的函数）

// 新建节点，返回编号
int newNode(const string& v) {
    tree[++node_cnt].val = v;
    tree[node_cnt].l = tree[node_cnt].r = 0;
    return node_cnt;
}

// 后缀表达式 -> 表达式树，返回根节点编号
int buildExprTree(const vector<string>& postfix) {
    int node_sta[maxn];  // 节点栈，存节点编号
    int top = 0;

    for (const string& token : postfix) {
        if (!isOperator(token)) {
            // 操作数 -> 新建叶子结点入栈
            node_sta[top++] = newNode(token);
        } else {
            int r = node_sta[--top];  // 先弹出的是右操作数
            int l = node_sta[--top];  // 再弹出的是左操作数
            int root = newNode(token);
            tree[root].l = l;
            tree[root].r = r;
            node_sta[top++] = root;   // 新子树入栈
        }
    }
    return node_sta[--top];  // 栈中最后一个节点就是根
}

// 后序遍历：左-右-根，恰好还原出后缀表达式
void postOrder(int u) {
    if (u == 0) return;
    postOrder(tree[u].l);
    postOrder(tree[u].r);
    cout << tree[u].val << ' ';
}

// 中序遍历：左-根-右，还原出中缀表达式（未处理括号，仅作示意）
void inOrder(int u) {
    if (u == 0) return;
    inOrder(tree[u].l);
    cout << tree[u].val << ' ';
    inOrder(tree[u].r);
}

int main() {
    vector<string> tokens = {"(", "2", "+", "3", "*", "(",
                             "8", "-", "4", ")", ")", "/", "5"};
    vector<string> postfix = infixToPostfix(tokens);

    cout << "后缀: ";
    for (const string& token : postfix) cout << token << ' ';
    cout << '\n';

    int root = buildExprTree(postfix);
    cout << "后序遍历: ";
    postOrder(root);
    cout << '\n';
    cout << "中序遍历: ";
    inOrder(root);
    cout << '\n';
}
```

运行结果：

```text
后缀: 2 3 8 4 - * + 5 / 
后序遍历: 2 3 8 4 - * + 5 / 
中序遍历: 2 + 3 * 8 - 4 / 5 
```

后序遍历的结果与后缀表达式完全一致，这说明「中缀 → 后缀 → 表达式树」整条链路是正确的。中序遍历得到的是去掉括号的中缀表达式——要恢复括号，需要在遍历时根据运算符优先级补上括号，这里不展开。

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
