//随机数据生成
#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e6;

std::random_device rd;
std::default_random_engine __rnd(rd());

// 预先定义的随机数生成器 https://en.cppreference.com/w/cpp/numeric/random
std::mt19937 mtrnd(rd());

// 每一次产生指定范围内的随机数
// std::uniform_int_distribution
// https://en.cppreference.com/w/cpp/numeric/random/uniform_int_distribution

//生成[l,r]之间的随机整数
int rnd(int l,int r) {
    return __rnd() % (r-l+1) + l;
}

// 洗牌,用于产生n个不重复的随机数
// 例如： [1,n] 区间随机排列
struct myShuffle {
    int a[maxn];
    int idx;
    myShuffle(int n) :idx(0)
    {
        for(int i = 0;i<=n;i++) a[i] = n;
        std::shuffle(a+1,a+n+1,mtrnd);
    }

    int get() {
        return a[++idx];
    }
};

int main() {
    int n = rnd(4,7);//生成一个[4,7]之间的随机数
    std::cout << n << "\n";

    return 0;
}
