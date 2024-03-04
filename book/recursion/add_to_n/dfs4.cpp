#include <iostream>
using namespace std;
int n;
int f(int n)
{
    //边界
    if( n == 1)
        return 1;
    return n + f(n - 1);
}
int main() {
    cin >> n;
    int ans = f(n);
    cout << ans << endl;
    return 0;
}