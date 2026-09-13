#include <cstdio>
#include <vector>
#include <algorithm>
using namespace std;

// 把排列切成最少条递增子序列,答案 = 最长递减子序列长度
int main(){
    int n;
    scanf("%d",&n);
    vector<int> tails; // 各队的队尾,严格递减
    for(int i=1;i<=n;i++){
        int x;
        scanf("%d",&x);
        // 找第一个队尾 < x 的队(递减数组上用 greater 的 upper_bound)
        auto it = upper_bound(tails.begin(), tails.end(), x, greater<int>());
        if(it == tails.end())      // 没有队尾 < x 的队,新开一队
            tails.push_back(x);
        else
            *it = x;               // 放入该队,更新队尾
    }
    printf("%d\n", (int)tails.size());
    return 0;
}
