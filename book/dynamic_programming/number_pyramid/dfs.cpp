#include <iostream>
using namespace std;

const int maxn = 1005;
int n;
int a[maxn][maxn];


//dfs(x,y)
int dfs(int x,int y) {
    //边界,最后一行
    if( x == n) return a[x][y];

    //向左走的最大值
    int t1 = dfs(x+1,y);
    //向右走的最大值
    int t2 = dfs(x+1,y+1);

    // t1 变成两者之间的最大的那个
    if( t1 < t2) t1 = t2;

    // 加上x,y这个点的值
    return a[x][y] + t1;

}

int main () {
    cin >> n;
    //读取数据
    for(int i=1;i<=n;i++) {
        for(int j =1;j<=i;j++)
            cin >> a[i][j];
    }

    int ans = dfs(1,1);
    cout << ans << endl;

    return 0;
}
