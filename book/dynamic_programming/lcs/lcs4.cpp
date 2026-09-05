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
// pre[i][j] =  0 表示 由左边来
// pre[i][j] =  1 表示 由上边来
// pre[i][j] =  2 表示 由斜对角边来
int pre[100][100];
const int up = 0;
const int Left = 1;
const int ul = 2;


int idx;
char ans[100];


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
            int t1 = f[i-1][j]; //上边
            int t2 = f[i][j-1]; //左边
            if( t1 > t2) {
                f[i][j] = t1;
                pre[i][j] = up;
                
            }
            else {
                f[i][j] = t2;
                pre[i][j] = Left;

            }
            if(a[i] == b[j] ) 
            {
                f[i][j] = f[i - 1][j-1]+1;
                pre[i][j] = ul;
            }
        }
    }

    //输出答案
    cout << f[la][lb] << endl;
    // 输出lcs 对应的字符串
    int i = la;
    int j = lb;

    while( i != 0 && j != 0) {
        if( pre[i][j] == ul)
        {
            ans[++idx] = a[i];
            i--;
            j--;
        }
        else if( pre[i][j] == up) {
            i--;
        }
        else j--;
    }
    for(int i = f[la][lb]; i>=1 ;--i ) // i: 1->n
    {
        cout << ans[i];
    }
    std::cout << "\n";

    return 0;
}
