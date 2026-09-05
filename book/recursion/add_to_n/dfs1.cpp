#include <iostream>
using namespace std;

int n; //全局变量
// calc是calculate的缩写，表示计算
// a表示给的数，
// s表示前面已经加起的数的和
int calc(int a,int s)
{
    if( a == n+1)
        return s;
    return calc(a + 1, s + a);
}

int main()
{
    cin >> n;//读取数字n
    int ans = calc(1,0); //从1开始计算
    cout << ans << endl; //输出结果
    return 0;
}