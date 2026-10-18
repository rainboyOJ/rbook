#include <iostream>
using namespace std;
int n,x,y;
int k;

// 得到最大的 k,使得 2^k <= n
int get_max_k(int n)
{
    int maxk = 0;
    while( (1<< (maxk+1) ) <= n) maxk++;
    return maxk;
}

//检查 pos 位置是否可行(本题:不超过目标 y 即可行)
bool check(int pos,int y) {
    return pos <=y;
}

//从x开始向右边跳到最后一个可行位置 y
void jump(int x,int y){
    // 从大到小枚举 2^i,能跳就跳
    for(int i = k ; i>=0;i--) {
        int len = (1<<i);       // 本轮尝试的跳跃长度是 2^i
        int pos = x+len;        // 跳过去之后的位置
        if(check(pos,y)) {      // 不越界才真的跳
            cout << x << " -- " << len << " --> " << pos << endl;
            x = pos;            // 用 pos 更新,写 x += len 也对
        }
    }
    cout << "final = " << x << " (目标 " << y << ")" << endl;
}

int main(int argc, char const *argv[])
{
    cin >> n >> x >> y;

    // 得到最大的k值,使得2^k <= n
    k = get_max_k(n);

    jump(x,y);

    return 0;
}
