int s[maxn];

int range_sum(int l,int r) {
    return s[r] - s[l-1];
}

//初始化 s数组
for (int i = 1; i <=n ; i++)
{
    cin >> s[i];
    s[i] += s[i-1];
}
