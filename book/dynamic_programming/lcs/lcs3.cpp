#include <iostream>
#include <cstring>
using namespace std;

char a[1000];
char b[1000];
int la,lb;
//f[i][j] 表示
// s1的前i个元素
// s2的前j个元素
// 时候的答案
int f[100][100];

int main(int argc, char const *argv[])
{
    cin >> a+1;
    cin >> b+1;
    la = strlen(a+1);
    lb = strlen(b+1);

    // 枚举a的前i个元素
    for(int i =1 ;i<= la;i++) {
        // 枚举b的前j个元素
        for(int j =1;j<=lb;j++) {
            //核心代码两行!!
            f[i][j] = max(f[i-1][j],f[i][j-1]);
            if(a[i] == b[j] ) f[i][j] = f[i - 1][j-1]+1;
        }
    }

    cout << f[la][lb] << endl;

    return 0;
}
