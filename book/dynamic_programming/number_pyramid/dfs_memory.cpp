#include <iostream>
using namespace std;

const int maxn = 1005;
int n;

int a[maxn][maxn];
// f[i][j] 就表示从(i,j)向下走的最大值
int f[maxn][maxn]; 


//dfs(x,y)
int dfs(int x,int y) {
  if( x == n) return a[x][y];
  if( f[x][y] != -1) return f[x][y];

  int t1 = dfs(x+1,y);
  int t2 = dfs(x+1,y+1);

  if( t1 < t2) t1 = t2;

  f[x][y] = a[x][y] + t1;
  return f[x][y];

}

int main () {
  cin >> n;
  for(int i=1;i<=n;i++) {
    for(int j =1;j<=i;j++)
      cin >> a[i][j];
  }

  for(int i =0;i<maxn;i++)
  for(int j =0;j<maxn;j++)
    f[i][j] = -1;
  /* memset() */

  int ans = dfs(1,1);
  cout << ans << endl;

  return 0;
}
