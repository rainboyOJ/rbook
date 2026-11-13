#include <algorithm>
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

struct Task {
    long long duration, deadline;
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    if (!(cin >> n)) return 0;
    vector<Task> tasks(n);
    for (auto &task : tasks) cin >> task.duration >> task.deadline;
    sort(tasks.begin(), tasks.end(), [](const Task &a, const Task &b) {
        return a.deadline < b.deadline;
    });

    priority_queue<long long> chosen; // 大根堆：耗时最长的已选任务
    long long total = 0;
    for (const auto &task : tasks) {
        chosen.push(task.duration);
        total += task.duration;
        if (total > task.deadline) {
            total -= chosen.top();
            chosen.pop(); // 可能撤销旧任务，也可能撤销刚加入的任务
        }
    }
    cout << chosen.size() << '\n';
}
