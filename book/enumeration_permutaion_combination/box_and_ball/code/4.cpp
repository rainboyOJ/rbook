#include <iostream>
using namespace std;
const int maxn = 1e5+5;
int n;
int rcd[maxn];

// dep 深度,当前给哪个盒子选
void full_comb(int dep,int p){

    //每一次进入都输出
    for(int i =1 ;i<dep;i++)
    {
        cout << rcd[i] << " ";
    }
    cout << endl;
    for(int i = p+1;i <=n;i++)
    {
        rcd[dep] = i;
        comb(dep+1,i);
    }
}

int main() {
    n = 3;
    comb(1,0);
    return 0;
}