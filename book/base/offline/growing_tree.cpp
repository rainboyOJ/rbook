#include <cstdio>
#include <vector>
using namespace std;

const int maxn = 5e5 + 5;

struct Op {
    int type;  // 1: 新建节点 u；2: 子树 v 加 x
    int u;
    long long x;
} ops[maxn];

int q, n, clk;
vector<int> adj[maxn];
int dfn[maxn], sz[maxn];
long long tr[maxn], ans[maxn];

int lowbit(int x) { return x & -x; }

void add(int x, long long v) {
    for (; x <= n; x += lowbit(x)) tr[x] += v;
}

// 差分树状数组：区间 [l, r] 加 v
void range_add(int l, int r, long long v) {
    add(l, v);
    if (r + 1 <= n) add(r + 1, -v);
}

// 单点查询 dfn 位置上的累计值
long long query(int x) {
    long long res = 0;
    for (; x > 0; x -= lowbit(x)) res += tr[x];
    return res;
}

void dfs(int u) {
    dfn[u] = ++clk;
    sz[u] = 1;
    for (int i = 0; i < (int)adj[u].size(); ++i) {
        int v = adj[u][i];
        dfs(v);
        sz[u] += sz[v];
    }
}

void solve() {
    scanf("%d", &q);
    n = 1;
    adj[1].clear();

    for (int i = 1; i <= q; ++i) {
        int op, v;
        scanf("%d%d", &op, &v);
        if (op == 1) {
            ++n;
            adj[n].clear();
            adj[v].push_back(n);
            ops[i] = {1, n, 0};
        } else {
            long long x;
            scanf("%lld", &x);
            ops[i] = {2, v, x};
        }
    }

    clk = 0;
    dfs(1);

    for (int i = 1; i <= n; ++i) tr[i] = 0;

    // 倒序：先生效的是出生之后的修改，遇到创建操作时立刻结算
    for (int i = q; i >= 1; --i) {
        if (ops[i].type == 2) {
            int v = ops[i].u;
            range_add(dfn[v], dfn[v] + sz[v] - 1, ops[i].x);
        } else {
            int u = ops[i].u;
            ans[u] = query(dfn[u]);
        }
    }
    ans[1] = query(dfn[1]);

    for (int i = 1; i <= n; ++i) {
        printf("%lld%c", ans[i], i == n ? '\n' : ' ');
    }
}

int main() {
    int T;
    scanf("%d", &T);
    while (T--) solve();
    return 0;
}
