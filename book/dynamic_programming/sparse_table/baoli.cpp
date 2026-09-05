#include <iostream>
using namespace std;
const int maxn = 1e5 + 5;

int n, q;
int a[maxn];

int query(int l,int r) {
    int t = a[l];
    for (int i = l + 1;i<= r; i++)
    {
        if( t < a[i])
            t = a[i];
    }
    return t;
}

int main() {
    cin >> n >> q;
    for(int i = 1; i <= n; i++)
        cin >> a[i];
    for (int i = 1; i <= q;i++) {
        int l, r;
        cin >> l >> r;
        cout << query(l, r) << "\n";
    }
        return 0;
}