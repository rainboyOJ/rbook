#include <iostream>
using namespace std;

int n;
int f(int n,int m){
    if( m == 1 || n == 0) return 1;
    if( m > n ) return f(n,n);

    int ans = 0;
    for(int i=1;i<=m;i++){
      ans += f(n-i,i);
    }
    return ans;
}
int main(){
    //输入数字
    cin >> n;
    int ans = f(n,n);
    cout << ans;
    return 0;
}
