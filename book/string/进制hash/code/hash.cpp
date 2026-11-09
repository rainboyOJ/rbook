#include <bits/stdc++.h>
using namespace std;

struct StringHash {
    using ull = unsigned long long;

    static constexpr ull BASE = 131;
    vector<ull> prefix;
    vector<ull> power;

    StringHash(const string &s) {
        int n = (int)s.size();
        prefix.assign(n + 1, 0);
        power.assign(n + 1, 1);

        for (int i = 1; i <= n; i++) {
            power[i] = power[i - 1] * BASE;
            prefix[i] = prefix[i - 1] * BASE + (unsigned char)s[i - 1];
        }
    }

    // 返回 1-based 子串 s[l..r] 的哈希值。
    ull get(int l, int r) const {
        if (l > r) return 0;
        return prefix[r] - prefix[l - 1] * power[r - l + 1];
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string s;
    cin >> s;

    StringHash hs(s);

    int q;
    cin >> q;
    while (q--) {
        int l1, r1, l2, r2;
        cin >> l1 >> r1 >> l2 >> r2;
        if (r1 - l1 != r2 - l2) {
            cout << "No\n";
            continue;
        }
        cout << (hs.get(l1, r1) == hs.get(l2, r2) ? "Yes" : "No") << '\n';
    }

    return 0;
}
