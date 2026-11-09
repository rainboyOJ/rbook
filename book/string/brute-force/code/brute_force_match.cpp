#include <bits/stdc++.h>
using namespace std;

vector<int> brute_force_match(const string &text, const string &pattern) {
    vector<int> positions;
    int n = (int)text.size();
    int m = (int)pattern.size();

    if (m == 0) return positions;

    for (int start = 0; start + m <= n; start++) {
        int matched = 0;
        while (matched < m && text[start + matched] == pattern[matched]) {
            matched++;
        }
        if (matched == m) positions.push_back(start);
    }

    return positions;
}

int main() {
    string text, pattern;
    cin >> text >> pattern;

    vector<int> positions = brute_force_match(text, pattern);
    if (positions.empty()) {
        cout << -1 << "\n";
        return 0;
    }

    for (int i = 0; i < (int)positions.size(); i++) {
        if (i) cout << ' ';
        cout << positions[i];
    }
    cout << "\n";

    return 0;
}
