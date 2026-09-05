#include <iostream>
#include <iomanip>
using namespace std;
const int maxn = 105;

int n = 4;
int m = 2;
int cnt = 0;
int ball[maxn] ;//记录ball i 在哪个盒子里
void print_stirling() {
    cout <<  setw(4) << ++cnt << ":   ";
    for(int i = 1;i <= m ;++i ) // i: 1->m
    {
        cout << "[ ";
        for(int j = 1;j <= n ;++j ) // j: 1->n
        {
            if( ball[j] == i )
                cout << j << " ";
        }
        cout << "] ";

    }
    cout << endl;
}

void stirling(int n,int m) {
    if( n < m ) return ;
    if( n == m) {
        for(int i =1;i<=m;i++)
            ball[i] = i;
        print_stirling();
        return;
    }
    if( m == 1) {
        for(int i =1;i<=n;i++)
            ball[i] = 1;
        print_stirling();
        return;
    }
    
    ball[n] = m;
    stirling(n-1,m-1);

    for(int i =1;i<=m;i++) {
        ball[n] = i;
        stirling(n-1,m);
    }
}

int main (int argc, char *argv[]) {
    stirling(n,m);
    return 0;
}
