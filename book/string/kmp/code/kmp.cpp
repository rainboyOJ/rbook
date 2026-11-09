#include <bits/stdc++.h>
using namespace std;

vector<int> build_prefix_function(const string &pattern) {
    int m = (int)pattern.size();
    vector<int> pi(m + 1, 0);

    // Logical positions are 1..m; the string remains physically 0-indexed.
    auto P = [&](int i) -> char { return pattern[i - 1]; };

    // At the start of each iteration, j == pi[i - 1].
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
            positions.push_back(i - m + 1); // 1-indexed match position
            j = pi[j];                      // Keep overlaps available
        }
    }

    return positions;
}
