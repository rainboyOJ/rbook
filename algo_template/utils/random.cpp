//随机数据生成
#include <bits/stdc++.h>
using namespace std;

std::random_device rd;
std::default_random_engine __rnd(rd());

//生成[l,r]之间的随机整数
int rnd(int l,int r) {
    return __rnd() % (r-l+1) + l;
}

int main() {
    int n = rnd(4,7);//生成一个[4,7]之间的随机数
    std::cout << n << "\n";

    return 0;
}
