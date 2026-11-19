#include <bits/stdc++.h>
using namespace std;

pair<string, string> rule[2][10];
int rule_count;
queue<string> q[2];
unordered_map<string, int> dis[2];  // 字符串状态无法直接用整数数组下标

int expand(int side) {
    int count = q[side].size(), answer = INT_MAX;
    while (count--) {  // 新入队的下一层留到下一轮处理
        string s = q[side].front();
        q[side].pop();
        int step = dis[side].at(s);
        for (int i = 0; i < rule_count; ++i) {
            const auto &[from, to] = rule[side][i];
            // 从 pos + 1 继续查找，保留重叠的出现位置。
            for (size_t pos = s.find(from); pos != string::npos;
                 pos = s.find(from, pos + 1)) {
                string next = s.substr(0, pos) + to + s.substr(pos + from.size());
                if (!dis[side].emplace(next, step + 1).second) continue;
                q[side].push(next);
                auto it = dis[side ^ 1].find(next);
                if (it != dis[side ^ 1].end()) {
                    answer = min(answer, step + 1 + it->second);
                }
            }
        }
    }
    return answer;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string start, goal, from, to;
    cin >> start >> goal;
    while (cin >> from >> to) {
        rule[0][rule_count] = {from, to};
        rule[1][rule_count++] = {to, from};  // 反向搜索必须交换规则两端
    }
    if (start == goal) {
        cout << 0 << '\n';
        return 0;
    }

    q[0].push(start);
    q[1].push(goal);
    dis[0][start] = dis[1][goal] = 0;
    // 每轮只让一侧的搜索半径增加 1；总半径最多增加到 10。
    for (int round = 0; round < 10 && !q[0].empty() && !q[1].empty(); ++round) {
        int side = (q[0].size() <= q[1].size()) ? 0 : 1;
        int answer = expand(side);
        if (answer != INT_MAX) {
            cout << answer << '\n';
            return 0;
        }
    }
    cout << "NO ANSWER!\n";
    return 0;
}
