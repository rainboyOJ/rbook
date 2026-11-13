#include <functional>
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    if (!(cin >> n)) return 0;
    priority_queue<long long, vector<long long>, greater<long long>> chosen;
    long long health = 0;
    for (int i = 0; i < n; ++i) {
        long long effect;
        cin >> effect;
        chosen.push(effect);
        health += effect;
        if (health < 0) {
            health -= chosen.top(); // 堆顶为最小的负数，减去它就是恢复血量
            chosen.pop();
        }
    }
    cout << chosen.size() << '\n';
}
