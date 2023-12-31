#include <iostream>
using namespace std;
const int maxn=qe5+5;
int a[maxn];
int n,m;

int find(int val) {
    for (int i = 1; i <= n; i++)
    {
        if (a[i] >= val)
            return i;
    }
    return n+1;
}


int main() {
    cin >> n >> m;
    for(int i =1;i<=n;i++ )
        cin >> a[i];
    for(int i =1;i<=m;i++) {
        int num;
        cin >> num;
        int pos = find(num);
        if( pos == n+1)  //没有找到
            cout << "not found\n";
        else
            cout << a[pos] << " " << pos << "\n";
    }
    return 0;
}