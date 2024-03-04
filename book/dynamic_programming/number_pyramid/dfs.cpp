#include <iostream>
using namespace std;

const int maxn = 1005;
int n;
int a[maxn][maxn];


//dfs(x,y)
int dfs(int x,int y) {
  if( x == n) return a[x][y];

  int t1 = dfs(x+1,y);
  int t2 = dfs(x+1,y+1);

  if( t1 < t2) t1 = t2;

  return a[x][y] + t1;

}

int main () {
  cin >> n;
  for(int i=1;i<=n;i++) {
    for(int j =1;j<=i;j++)
      cin >> a[i][j];
  }

  int ans = dfs(1,1);
  cout << ans << endl;

  return 0;
}
