# 树的入门

## 什么是树
树（Tree）是图论中的一种无向无环连通图。在计算机科学中，我们常用**有根树**（Rooted Tree）来表示具有层次结构的数据。
相关概念：
- **节点（Node）**：树中的每一个元素。
- **根节点（Root）**：树的顶端节点，没有父节点。
- **叶子节点（Leaf）**：没有子节点的节点。
- **父节点（Parent）** 和 **子节点（Child）**：相连的两层节点。
- **深度（Depth）**：从根节点到某节点的边数。
- **二叉树（Binary Tree）**：每个节点最多有两个子节点（分别称为左孩子和右孩子）的树。

## 树的存储方式

在算法竞赛中，最常用的树存储方式有两种：**邻接表（适用于普通树）** 和 **数组存储（适用于二叉树）**。

### 1. 邻接表（`std::vector`）
对于一棵普通的树，一个节点可能有任意多个子节点。这时候我们可以用 `std::vector` 来存储每个节点的相邻节点。

```cpp
#include <vector>
using namespace std;

const int N = 100005;
vector<int> edge[N]; // edge[u] 存储与节点 u 相连的所有节点

void add_edge(int u, int v) {
    edge[u].push_back(v);
    edge[v].push_back(u); // 无向图/无根树需要建立双向边
}
```

### 2. 二叉树的数组存储
由于二叉树每个节点最多只有左、右两个孩子，我们可以直接用数组 `lc` 和 `rc` 记录每个节点的左孩子和右孩子（Left Child, Right Child）。

```cpp
const int N = 100005;
int lc[N]; // lc[i] 表示节点 i 的左孩子，0 表示没有
int rc[N]; // rc[i] 表示节点 i 的右孩子，0 表示没有
```
或者使用结构体数组：
```cpp
struct Node {
    int l, r;
    // 还可以记录节点的其他信息，比如权值等
} tree[N];
```

## 树的遍历

对于二叉树，有三种经典的遍历方式，它们的区别仅仅在于**访问当前节点**的时机：
1. **前序遍历（Pre-order）**：根 $\to$ 左子树 $\to$ 右子树
2. **中序遍历（In-order）**：左子树 $\to$ 根 $\to$ 右子树
3. **后序遍历（Post-order）**：左子树 $\to$ 右子树 $\to$ 根

代码实现通常使用**递归**：

```cpp
void preorder(int u) {
    if (u == 0) return; // 0 表示空节点
    cout << u << " ";   // 访问根节点
    preorder(lc[u]);    // 访问左子树
    preorder(rc[u]);    // 访问右子树
}

void inorder(int u) {
    if (u == 0) return;
    inorder(lc[u]);
    cout << u << " ";
    inorder(rc[u]);
}

void postorder(int u) {
    if (u == 0) return;
    postorder(lc[u]);
    postorder(rc[u]);
    cout << u << " ";
}
```

## 根据遍历序列还原二叉树

这是竞赛中极其经典的题型。已知**前序+中序**，或者**后序+中序**，我们可以唯一确定一棵二叉树。（注意：前序+后序无法唯一确定一棵树，例如题目 P1229 就是求前序+后序有多少种可能的树）。

**核心思想（以前序+中序为例）：**
1. **前序遍历**的第一个元素一定是这棵（子）树的**根节点**。
2. 拿着这个根节点，去**中序遍历**的序列中查找。
3. 根节点将中序遍历一分为二：左边是**左子树的中序遍历**，右边是**右子树的中序遍历**。
4. 根据左、右子树的长度，我们可以在前序序列中划分出左子树和右子树的前序序列。
5. 递归处理左子树和右子树。

**举个例子：**
假设前序是 `ABDEC`，中序是 `DBEAC`。
- 从前序可知根节点是 `A`。
- 在中序中找到 `A`：`DBE | A | C`。
- 左子树的中序是 `DBE`（长度3），右子树的中序是 `C`（长度1）。
- 所以前序中排在 `A` 后面的3个元素 `BDE` 就是左子树的前序，剩下的 `C` 就是右子树的前序。
- 对左子树（前序 `BDE`，中序 `DBE`）继续递归。

对于只有字母的小规模字符串，代码实现可以用 `std::string` 的 `substr` 截取来简化编写：

```cpp
#include <iostream>
#include <string>
using namespace std;

// 传入前序和中序，输出后序
void build(string pre, string in) {
    if (pre.empty()) return;
    
    char root = pre[0]; // 前序的第一个是根
    int pos = in.find(root); // 根在中序中的位置
    
    // 递归左子树：
    // 左子树的前序长度等于左子树的中序长度 (pos)
    build(pre.substr(1, pos), in.substr(0, pos));
    
    // 递归右子树：
    build(pre.substr(pos + 1), in.substr(pos + 1));
    
    // 输出后序（左 -> 右 -> 根）
    cout << root;
}
```
