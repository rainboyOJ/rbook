#include <bits/stdc++.h>
using namespace std;

vector<int> build_prefix_function(const string &pattern) {
    int m = (int)pattern.size();
    vector<int> pi(m + 1, 0);

    auto P = [&](int i) -> char { return pattern[i - 1]; };

    for (int i = 2, j = 0; i <= m; i++) {
        while (j > 0 && P(i) != P(j + 1)) {
            j = pi[j];
        }
        if (P(i) == P(j + 1)) j++;
        pi[i] = j;
    }

    return pi;
}

vector<int> kmp_match(const string &text, const string &pattern) {
    vector<int> positions;
    int n = (int)text.size();
    int m = (int)pattern.size();

    if (m == 0) return positions;

    vector<int> pi = build_prefix_function(pattern);
    auto T = [&](int i) -> char { return text[i - 1]; };
    auto P = [&](int i) -> char { return pattern[i - 1]; };

    for (int i = 1, j = 0; i <= n; i++) {
        while (j > 0 && T(i) != P(j + 1)) {
            j = pi[j];
        }
        if (T(i) == P(j + 1)) j++;

        if (j == m) {
            positions.push_back(i - m + 1);
            j = pi[j];
        }
    }

    return positions;
}

int main() {
    string text, pattern;
    cin >> text >> pattern;

    vector<int> positions = kmp_match(text, pattern);
    if (positions.empty()) {
        cout << -1 << '\n';
        return 0;
    }

    for (int i = 0; i < (int)positions.size(); i++) {
        if (i) cout << ' ';
        cout << positions[i];
    }
    cout << '\n';

    return 0;
}
