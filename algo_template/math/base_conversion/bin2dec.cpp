#include <iostream>
#include <cstring>
using namespace std;

char a[10000];

//2进制转10进制
int bin2dec(char *s) {
  int len = strlen(s+1); // 从s＋１这个位置求字符串的长度
  int ans = 0;

  int base = 1;
  for(int i =len;i>=1;i--) {
    int a = s[i] - '0';
    ans += a * base;
    // 调试用
    // cout << a << " * " << base << " + " << endl;
    base *= 2;
  }
  return ans;
}

int main()
{
  cin >> a+1;
  // cout << a+1;
  int ans = bin2dec(a); 
  cout << ans << endl;
  return 0;
}