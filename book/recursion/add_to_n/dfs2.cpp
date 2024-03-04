#include <iostream>
using namespace std;

int n; //全局变量
int calc(int a,int s)           // <-+
{                               //   |
    if( a == n+1)               //   |
        return s;               //   |   ---+ second
    return calc(a + 1, s + a);  //   |      |
}                               //   |      |
                                //   |      |
int main()                      //   |      |
{                               //   |      |
    n = 0; //                        |      |
    int ans = calc(1,0); // first ---+      |
            //  ^                           |
            //  |                           |
            //  +---------------------------+
    cout << ans << endl;
    return 0;
}