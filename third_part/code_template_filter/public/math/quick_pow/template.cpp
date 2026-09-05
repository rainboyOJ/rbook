//口决: 是1就乘,base增增
template<typename  T =long long>
T quick_pow(T base, T b ,T mod) {
    T ans = 1 % mod; //防止 mod 是 1
    for(; b; b>>=1)
    {
        if(b & 1)
            ans = ans * base % mod;
        base = base * base % mod;
    }
    return ans;
}
