#include <bits/stdc++.h>
using namespace std;

typedef long long ll;

int ls(int p) { return p << 1; }      // 左孩子 2p
int rs(int p) { return p << 1 | 1; }  // 右孩子 2p+1

const int maxn = 100000 + 5;
// 矩形下边产生 +1 事件，上边产生 -1 事件，作用于横向半开区间 [x1,x2)。
struct Event {
    ll y, x1, x2;
    int delta;
};
// cover[p] 只记录完整停在当前节点的覆盖次数，不是每个点的总覆盖次数。
int n, kinds, cover[maxn * 8];
// xs 保存去重后的真实横坐标。叶子 i 表示 [xs[i],xs[i+1])。
// len[p] 合并本节点及后代记录的覆盖长度，不计祖先的整段覆盖。
ll xs[maxn * 2], len[maxn * 8];
Event events[maxn * 2];

// 有整段覆盖就取真实长度；否则叶子为 0，内部节点合并孩子。
void pushup(int p, int l, int r) {
    if (cover[p] > 0) len[p] = xs[r + 1] - xs[l];
    else if (l == r) len[p] = 0;
    else len[p] = len[ls(p)] + len[rs(p)];
}

// [L,R] 是坐标段编号范围；同一矩形加入、撤销时停在相同节点。
void update(int p, int l, int r, int L, int R, int delta) {
    if (r < L || R < l) return;  // 空交集直接返回，不修改节点
    if (L <= l && r <= R) {
        cover[p] += delta;
        pushup(p, l, r);
        return;
    }
    // 不下传 cover，局部覆盖仍在孩子中独立保留。
    int mid = (l + r) / 2;
    update(ls(p), l, mid, L, R, delta);
    update(rs(p), mid + 1, r, L, R, delta);
    pushup(p, l, r);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> n;
    int count = 0;
    for (int i = 1; i <= n; ++i) {
        ll x1, y1, x2, y2;
        cin >> x1 >> y1 >> x2 >> y2;
        events[++count] = {y1, x1, x2, 1};  // 下边：开始覆盖
        xs[count] = x1;
        events[++count] = {y2, x1, x2, -1};  // 上边：结束覆盖
        xs[count] = x2;
    }
    // 离散化只保存端点顺序，长度仍用原坐标相减。
    sort(xs + 1, xs + count + 1);
    kinds = int(unique(xs + 1, xs + count + 1) - xs - 1);
    sort(events + 1, events + count + 1, [](const Event &a, const Event &b) {
        return a.y < b.y;
    });
    ll answer = 0, previous_y = events[1].y;
    int i = 1;
    while (i <= count) {
        ll y = events[i].y;
        // 先结算上一高度到当前高度的横带，此时根保存的是旧覆盖长度。
        answer += len[1] * (y - previous_y);
        // 同高度事件之间没有面积，全部处理后再进入下一条横带。
        while (i <= count && events[i].y == y) {
            int L = int(lower_bound(xs + 1, xs + kinds + 1, events[i].x1) - xs);
            // 右端点不对应被覆盖的叶子，要减 1；全树共有 kinds-1 个坐标段。
            int R = int(lower_bound(xs + 1, xs + kinds + 1, events[i].x2) - xs) - 1;
            update(1, 1, kinds - 1, L, R, events[i].delta);
            ++i;
        }
        previous_y = y;
    }
    cout << answer << '\n';
    return 0;
}
