#include <iostream>
using namespace std;

//n 盘子的数量
//a,b,c 起始柱,中间柱,目标柱
int hanoi(int n,char a,char b,char c) {
    if( n == 0 ) return 0;
    int num = 0;
    num += hanoi(n-1,a,c,b);
    cout << a << "->" << c << endl;
    num += hanoi(n-1,b,a,c);
    return num;
}

int main() {
    int n;
    cin >> n;
    int ans = hanoi(n,'A','B','C');
    cout << ans << endl;
    return 0;
}