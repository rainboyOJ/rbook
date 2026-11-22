#include <algorithm>
#include <cstdio>
using namespace std;

const int maxn = 5e5 + 5;

struct Node {
    int val, pos;
    bool operator<(const Node &other) const {
        return val > other.val;  // 按数值从大到小排序
    }
} a[maxn];

int n, tr[maxn];

int lowbit(int x) { return x & -x; }

void add(int x, int v) {
    for (; x <= n; x += lowbit(x)) tr[x] += v;
}

int sum(int x) {
    int res = 0;
    for (; x > 0; x -= lowbit(x)) res += tr[x];
    return res;
}

int main() {
    scanf("%d", &n);
    for (int i = 1; i <= n; ++i) {
        scanf("%d", &a[i].val);
        a[i].pos = i;
    }

    sort(a + 1, a + n + 1);

    long long ans = 0;
    for (int l = 1, r; l <= n; l = r) {
        r = l;
        while (r <= n && a[r].val == a[l].val) ++r;  // 数值相同的一组 [l, r)

        // 先统一查询，再统一插入，避免同值互相计入
        for (int i = l; i < r; ++i) {
            ans += sum(a[i].pos - 1);
        }
        for (int i = l; i < r; ++i) {
            add(a[i].pos, 1);
        }
    }

    printf("%lld\n", ans);
    return 0;
}
