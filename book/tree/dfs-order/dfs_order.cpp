#include <bits/stdc++.h>
using namespace std;

const int maxn = 1e5 + 5;

// DFS 序：全局数组 + 自由函数，不含 main，直接复制进题解。
// 用法：
//   1. 读边：tree[u].push_back(v); tree[v].push_back(u);
//   2. dfs_order(1, 0);          // 递归版
//      或 dfs_order_iter(1);     // 链形树怕爆栈时用迭代版
//   3. 之后直接用 in_ / out_ / sz / dep / order_，
//      再用 is_ancestor(u, v) 判祖孙、subtree_size(u) 取子树大小。
//
// 编号 1..n，根的 in_ 一定是 1；父亲哨兵取 0，dep[0] = 0。
// 递归深度最坏是 n（链），n >= 1e5 时开大栈（ulimit -s unlimited）或换迭代版。

vector<int> tree[maxn];

int in_[maxn], out_[maxn];  // 子树 u 对应时间戳区间 [in_[u], out_[u]]
int sz[maxn], dep[maxn];    // 子树大小、深度（根的深度为 1）
int order_[maxn];           // order_[i] = 第 i 个被访问的点
int timer;                  // 时间戳计数器，取值 1..n

void dfs_order(int u, int fa) {
    in_[u] = ++timer;  // 进入 u：拿一个时间戳
    order_[timer] = u;
    sz[u] = 1;
    for (int v : tree[u]) {
        if (v == fa) continue;  // 无向边存了两遍，跳过父亲就是只往下走
        dep[v] = dep[u] + 1;
        dfs_order(v, u);
        sz[u] += sz[v];
    }
    out_[u] = timer;  // 退出 u：子树全走完，timer 就是区间右端点
    // 等价写法：out_[u] = in_[u] + sz[u] - 1;
}

// 迭代版：栈里放 (点, 父亲, 下一条待处理的邻边下标)
void dfs_order_iter(int root) {
    vector<tuple<int, int, int>> st;
    st.emplace_back(root, 0, 0);
    while (!st.empty()) {
        auto [u, fa, idx] = st.back();
        if (idx == 0) {  // 第一次弹到 u，等价于递归版的“进入”
            in_[u] = ++timer;
            order_[timer] = u;
            sz[u] = 1;
        }
        bool advanced = false;
        while (idx < (int)tree[u].size()) {
            int v = tree[u][idx++];
            if (v == fa) continue;
            dep[v] = dep[u] + 1;
            st.back() = make_tuple(u, fa, idx);  // 记住自己处理到哪条边
            st.emplace_back(v, u, 0);
            advanced = true;
            break;
        }
        if (!advanced) {  // 邻边走完，等价于递归版的“退出”
            out_[u] = timer;
            st.pop_back();
            if (!st.empty()) {
                sz[get<0>(st.back())] += sz[u];  // 子树大小交回父亲
            }
        }
    }
}

// u 是不是 v 的祖先（u == v 也算）
// 等价写法：in_[u] <= in_[v] && out_[v] <= out_[u]
bool is_ancestor(int u, int v) {
    return in_[u] <= in_[v] && in_[v] <= out_[u];
}

int subtree_size(int u) {
    return out_[u] - in_[u] + 1;  // 恒等于 sz[u]
}

// 欧拉序：进入写一次，每从一个儿子返回再写一次，长度 2n-1。
// 它和先序不是一回事：每个点会重复出现，可配合 RMQ 求 LCA。
int euler[2 * maxn], etot;

void dfs_euler(int u, int fa) {
    euler[++etot] = u;
    for (int v : tree[u]) {
        if (v == fa) continue;
        dfs_euler(v, u);
        euler[++etot] = u;
    }
}
