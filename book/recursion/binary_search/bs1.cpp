#include <iostream>
using namespace std;
const int maxn=1e5+5;
int a[maxn];
int n,m;

int mid(int l,int r) {
    return (l+r) >> 1; //这是最快的写法
}

//检查pos位置的值是否符合要求
bool check(int pos,int val){
    return a[pos] >= val;
}

//bs_find = binary search find
int bs_find(int l,int r,int val) {
    while( l < r) {
        int m = mid(l,r);
        if( check(m,val)) //成立
            r = m;
        else //不成立,抛弃左半边
            l = m+1;
    }
    return l ;
}


int main() {
    cin >> n >> m;
    for(int i =1;i<=n;i++ )
        cin >> a[i];
    for(int i =1;i<=m;i++) {
        int num;
        cin >> num;
        int pos = bs_find(1,n+1,num);
        if( pos == n+1)  //没有找到
            cout << "not found\n";
        else
            cout << a[pos] << " " << pos << "\n";
    }
    return 0;
}
