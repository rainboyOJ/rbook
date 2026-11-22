#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

// 离散化工具结构体
template<typename T = int>
struct Discrete {
    vector<T> raw; // 收集的所有元素

    // 清空数据
    void clear() {
        raw.clear();
    }

    // 添加单个元素
    void push(const T &val) {
        raw.push_back(val);
    }

    // 支持添加多个元素 disc.push(x, y, z);
    template<typename... Args>
    void push(const T &first, const Args&... rest) {
        push(first);
        push(rest...);
    }

    // 排序并去重
    void init() {
        sort(raw.begin(), raw.end());
        raw.erase(unique(raw.begin(), raw.end()), raw.end());
    }

    // 离散化后不同元素的数量
    int size() const {
        return raw.size();
    }

    // 查询原数值 val 对应的 1-based 排名
    int query(const T &val) const {
        auto it = lower_bound(raw.begin(), raw.end(), val);
        if (it != raw.end() && *it == val) {
            return static_cast<int>(it - raw.begin()) + 1;
        }
        return 0; // 0 表示不存在
    }

    // 重载下标运算符，直接通过 disc[val] 得到排名
    int operator[](const T &val) const {
        return query(val);
    }

    // 根据排名 rank (1-based) 反查原值
    T get_val(int rank) const {
        return raw[rank - 1];
    }
};

int main() {
    Discrete<int> disc;

    // 收集所有需要离散化的点（如区间端点、坐标等）
    disc.push(1000000000, 25, 1000000000, 4, 25);

    // 完成离散化
    disc.init();

    cout << "不同元素个数: " << disc.size() << "\n"; // 3
    cout << "25 的排名: " << disc[25] << "\n";         // 2
    cout << "10^9 的排名: " << disc[1000000000] << "\n"; // 3
    cout << "4 的排名: " << disc[4] << "\n";           // 1
    cout << "排名 2 对应的原值: " << disc.get_val(2) << "\n"; // 25

    return 0;
}
