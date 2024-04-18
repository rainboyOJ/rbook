#include <iostream>
#include <cstring>
#include <algorithm>

using namespace std;

typedef long long LL;

const int N = 3e5 + 10;

int n, m;
LL s[N], que[N];

int main()
{
    scanf("%d%d", &n, &m);
    for (int i = 1; i <= n; i ++ ) scanf("%lld", &s[i]), s[i] += s[i - 1];

    LL res = -1e18;
    int hh = 0, tt = 0; que[0] = 0;
    for (int i = 1; i <= n; i ++ )
    {
        while (hh <= tt && i - que[hh] > m) hh ++ ;
        res = max(res, s[i] - s[que[hh]]);
        while (hh <= tt && s[que[tt]] >= s[i]) tt -- ;
        que[ ++ tt] = i;
    }
    printf("%lld\n", res);
    return 0;
}
