#include <iostream>
using namespace std;
int n,x,y;
int k;

int get_max_k(int n)
{
    int maxk = 0;
    while( (1<< (maxk+1) ) <= n) maxk++;
    return maxk;
}

//检查 pos 位置是否可行
bool check(int pos,int y) {
    return pos <=y;
}

//从x开始向右边跳到 y
void jump(int x,int y){
    for(int i = k ; i>=0;i--) {
        int len = (1<<k);
        int pos = x+len;
        if(check(pos,y)) {
            cout << x << "-- " << len << "-- > " << x+len << endl;
            x += len;
        }
    }
}

int main(int argc, char const *argv[])
{
    cin >> n >> x >> y;

    // 得到最大的k值,使得2^k < n;
    k = get_max_k(n);

    jum(x,y);


    return 0;
}
