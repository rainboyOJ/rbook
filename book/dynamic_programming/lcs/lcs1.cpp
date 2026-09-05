#include <iostream>
#include <cstring>
using namespace std;

char a[1000];
char b[1000];
int la,lb;
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
            f[i][j] = max(f[i-1][j],f[i][j-1]);

            //考虑ai 一定出现
            for(int k = j ;k >= 1 ;k--)
            {
                if( a[i] == b[k])
                    f[i][j] = max(f[i][j],f[i-1][k-1]+1);
            }
            //考虑bj 一定出现
            for(int k = i ;k >= 1 ;k--)
            {
                if( a[k] == b[j])
                    f[i][j] = max(f[i][j],f[k-1][j-1]+1);
            }
        }
    }

    cout << f[la][lb] << endl;

    return 0;
}
