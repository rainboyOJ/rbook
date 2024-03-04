#include <iostream>
#include <cstring>
using namespace std;

char a[1000];
char b[1000];
int f[1000][1000];

// f[i][j] = max(  f[i-1][j],f[i][j-1], f[i-1][j-1]+1 )

int main() {
  cin >> a+1;
  cin >> b+1;
  int la = strlen(a+1);
  int lb = strlen(b+1);

  for(int i =1 ;i <= la;i++) {
    for(int j =1 ;j<= lb ;j++) {
      int t1 = f[i-1][j];
      int t2 = f[i][j-1];
      if( t1 < t2) t1 = t2; //两者之间的最值
        
      if( a[i] == b[j]) {
        int t3 = f[i-1][j-1]+1;
        f[i][j] = max(t1,t3); //三者之间的最值
      }
      else f[i][j] = t1; // 两者之间的最值
    }
  }
  for(int i =0 ;i <= la;i++) {
    for(int j =0 ;j<= lb ;j++) {
      cout << f[i][j] << " ";
    }
    cout << endl;
  }
  cout << f[la][lb] << endl;

  return 0;
}
