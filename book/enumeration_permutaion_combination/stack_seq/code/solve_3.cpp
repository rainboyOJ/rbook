#include <iostream>
using namespace std;
typedef long long ll;

int n;
ll f[50][50]; //记忆化,存值

ll dfs(int i,int j) {
    if( i == 0) return 1;
    if( f[i][j] !=0 ) return f[i][j];

    if( j == 0) { //只能入栈
        f[i][j] += dfs(i-1,j+1);
    }
    //待入的队列,和在栈内的,都有
    if( j > 0 && i > 0 ) {
        f[i][j] += dfs(i-1,j+1) + dfs(i,j-1);
    }
    return f[i][j];
}

int main() {
    cin >> n; //读取带入栈
    ll ans = dfs(n,0);
    cout << ans << endl;
    return 0;
}