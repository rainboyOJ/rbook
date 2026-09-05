#include <iostream>
using namespace std;

const int maxn = 1e5 + 5;
int a[maxn]; //存二进制的数
int n;

//10进制转2进制
// 返回二进制的长度
// 结果存到数组a里,最后反向输出
int dec2bin(int n) {
    int len = 0;
    while( n ) {
        a[++len] = n % 2;
        n /= 2;
    }
    return len;
}

int main()
{
    cin >> n;
    int len = dec2bin(n);
    for(int i = len;i>=1;i--)
    {
        cout << a[i];
    }
    cout <<endl;
    return 0;
}