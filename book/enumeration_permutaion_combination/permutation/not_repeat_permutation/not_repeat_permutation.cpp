#include <bits/stdc++.h>
using namespace std;

const int maxn = 1e5+5;
int n; //n个数
int m; //m个

int rcd[maxn]; //record记录, 第i桶对应的数字
int b[maxn]; //桶,箱子
int b_idx; //桶记数

int choose[maxn]; //选择的数

//数据读取
void init() {
    std::cin >> n;
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        int j,t;
        std::cin >> t;
        for(j = 1;j <= b_idx ;++j ) // j: 1->b
        {
            if( rcd[j] == t )
            {
                b[j]++;
                break;
            }
        }
        if( j == b_idx+1) { //没有找到
            b_idx++;
            b[b_idx] = 1;
            rcd[b_idx] = t;
        }
    }
}

void not_repeat_permutation(int dep)
{
    if( dep > n) { //到达边界
        for(int i = 1;i <= n ;++i ) // i: 1->n
        {
            cout << choose[i] << " ";
        }
        cout << endl;
        return;
    }

    for(int i =1;i<=b_idx;i++) {
        if( b[i] > 0) {
            b[i]--;
            choose[dep] = rcd[i];
            not_repeat_permutation(dep+1);
            b[i]++;
        }
    }
}


int main () {
    init();
    not_repeat_permutation(1);
    return 0;
}
