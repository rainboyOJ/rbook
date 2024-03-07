#include <iostream>
using namespace std;

const int maxn = 1e5+5;
int f[max];
int fibonacci(int n) {
    if( n ==1 || n ==2 )
        return 1;

    //如果f[n]的值不是0,表明已经得到值了
    // 直接返回
    if( f[n] != 0) return f[n];

    // 重新计算,并返回
    f[n] = fibonacci(n-1) + fibonacci(n-2);
    return f[n];
}

int main() {
    int n;
    cin >> n;
    int ans = fibonacci(n);
    cout << ans;
    return  0;
}