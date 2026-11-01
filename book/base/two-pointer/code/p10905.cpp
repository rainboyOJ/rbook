// P10905 [蓝桥杯 2024 省 C] 回文字符串
// 朴素做法:枚举前面补了几个字符 O(n^2),能过 |S| <= 1000 的 50 分
#include <bits/stdc++.h>
using namespace std;

string s;

// s 的长度为 x 的前缀是不是回文
bool pre_palindrome(int x) {
    int i = 0, j = x - 1;
    while (i < j) {
        if (s[i] != s[j]) return false;
        i++;
        j--;
    }
    return true;
}

// 补上的字符只能取 l q b
bool can_fill(char ch) {
    return ch == 'l' || ch == 'q' || ch == 'b';
}

bool solve() {
    int n = (int)s.size();
    // 枚举 x:前 x 个字符自己回文,后 n-x 个字符交给补的 l/q/b
    for (int x = n; x >= 0; x--) {
        bool ok = true;
        for (int i = x; i < n; i++)
            if (!can_fill(s[i])) ok = false;
        if (ok && pre_palindrome(x)) return true;
    }
    return false;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(0);

    int T;
    cin >> T;
    while (T--) {
        cin >> s;
        cout << (solve() ? "Yes" : "No") << "\n";
    }
    return 0;
}
