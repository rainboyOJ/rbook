//这里是得到sparse table 的dp算法

const int maxn = 1e5+5;
const int maxk = 50; //这里为什么取50,因为足够大

int f[maxn][maxk]; //定义dp数组

int n; //区间总长度
int a[maxn]; //原始数组

void init_st() {
    //边界
    for(int i=1; i<=n; i++) f[i][0] = a[i];

    // 枚举长度
    for (int k = 1; k <= maxk; k++)
    {
        //枚举起点
        // 这里i+(1<<k) 表示 以i为起点的长度为2^k的区间 的右端点
        // [------ ][there]
        // 这里这样写是为了防止越界
        for (int i = 1; i+(1<<k) <= n+1 ;i++) {
            f[i][k] = max(f[i][k - 1], f[i + 1 << (k - 1)][k - 1]);
        }
    }
}