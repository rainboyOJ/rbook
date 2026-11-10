#include <iostream>
#include <string>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string s;
    int k;
    cin >> s >> k;

    for (int i = 0; i < k; i++) {
        int pos = 0;
        int len = s.size();

        // 越过单调不降的前缀，找到第一个下降位置。
        while (pos + 1 < len && s[pos] <= s[pos + 1]) {
            pos++;
        }
        // 若一直没有下降，pos 恰好停在最后一位。
        s.erase(pos, 1);
    }

    // 恰好删完 k 位后，再处理输出时的前导零。
    int first = 0;
    int len = s.size();
    while (first < len && s[first] == '0') {
        first++;
    }

    if (first == len) {
        cout << 0 << '\n';
    } else {
        cout << s.substr(first) << '\n';
    }
    return 0;
}
