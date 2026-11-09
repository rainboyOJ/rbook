#include <bits/stdc++.h>
using namespace std;

int minimal_rotation_pos(const string &s) {
    int n = (int)s.size();
    int i = 0;
    int j = 1;
    int k = 0;

    while (i < n && j < n && k < n) {
        char a = s[(i + k) % n];
        char b = s[(j + k) % n];

        if (a == b) {
            k++;
        } else if (a > b) {
            i += k + 1;
            if (i == j) i++;
            k = 0;
        } else {
            j += k + 1;
            if (i == j) j++;
            k = 0;
        }
    }

    return min(i, j);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string s;
    cin >> s;

    int pos = minimal_rotation_pos(s);
    for (int i = 0; i < (int)s.size(); i++) {
        cout << s[(pos + i) % (int)s.size()];
    }
    cout << '\n';

    return 0;
}
