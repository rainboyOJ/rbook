//Author by [Rainboy](https://github.com/rainboylvx) 
//date: 2024-06-28 19:41:41
#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e6+5;
int n,m;
int a[maxn];

void print_a() {
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        cout << a[i] << " ";
    }
    std::cout  << "\n";
}

void next_permutation() {

    while (1) {
        print_a();
        // 从右向左找到第一个非递增的数
        int idx = 0;
        for(int i = n-1 ;i >= 1; --i) {
            if( a[i] < a[i+1]) {
                idx = i;
                break;
            }
        }

        //没有找到,说明达到最后一种终止状态
        if( idx == 0) return ;

        // 从右向左找到第一个比交换点大的数
        int j ;
        for(int i = n ;i >=1 ; --i) {
            if( a[i] > a[idx])
            {
                j = i;
                break;
            }
        }

        //交换
        std::swap(a[idx],a[j]);

        //排序
        if( idx+1 < j )
            std::sort(a+idx+1,a+j);
    }

}

int main (int argc, char *argv[]) {
    std::cin >> n;
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        a[i] = i;
    }
    next_permutation();

    return 0;
}
