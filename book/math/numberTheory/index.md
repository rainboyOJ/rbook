- 素数
  - 素数判断
    - 试除法: `for(int i = 2;i*i<=n;i++){ if( n % i == 0) return false;}`
    - 随机算法
      - Miller-Robbin
  - 素数筛选
    - Eratoshenes筛法
      - 原理:任意整数``x``的整数倍``k \cdot x (k \ge 2)``都不是素数
      - 可以证明: `[2,n]`之间的所有合数,都是``[2,\sqrt(n)]``之间素数的倍数
        - 显然`[2,\sqrt(n)]`之间的合数都成立
        - 只要证明`[\sqrt(n)],n`之间的合数,使用反证法
      - 操作:
      ```cpp
      //求[2,n]的所有素数
      bool notp[maxn];//合数标记
      void e_primes(int n){
          memset(notp,0,sizeof(notp));
          for(int i = 2;i*i <=n;++i)
          {
            if(notp[i] == 0)
            {
              for(int j = i+i;j<=n;j+=i)
                notp[j] = 1;
            }
          }
      }
      ```
      - 时间为`nlog^{log^n}`,接近`O(n)`
    - 线性筛法:欧拉筛
      - 目标: 每个合数只被标记一次
      - 数学原理: 根据算术基本定理,每个合数``x``都可以被**唯一写成:**``x = p * k``这种形式,p是x的最小素因子
      - 核心思想: 根据计数原理,只要保证每个合数只被`p*k`的形式删除,就能只删除一次
      ```cpp
      bool notp[N];
      int primes[N]; //存素数
      int m; //素数的个数

      //筛n以内的素数
      void init(int n = N) {
          memset(notp,0,sizeof(notp));
          m = 0;
          for(int i=2;i<=n;i++)
          {
              if(!notp[i]) primes[++m] = i; //存下素数
              for(int j =1;j<=m;j++)
              {
                  //超过n的范围
                  // if( i*primes[i] > n)
                  if( primes[i] > n/i) break;
                  if( i % primes[j] ) break; //是i的因子
                  notp[i*primes[j]] = 1;  //标记
              }
          }
      }
      ```
  - 质因数分解
    - 朴素试除法
      - 时间`O(\sqrt(N))`
      ```
      //试除法
      int m;
      int p[1000];
      int c[1000];
      void divide(int n){
          m  =0;
          for( int i = 2;i*i<=n;i++) {
              if( n % i == 0)
              {
                  p[++m] = i,c[m] = 0;
                  while( n % i == 0) {
                      n /=i;
                      c[m]++;
                  }
              }
          }
          if( n > 1)
              p[++m] = n,c[m] = 1;
      }

      int main (int argc, char *argv[]) {
          int a = 114514;
          divide(a);
          int n = m;
          for(int i = 1;i <= n ;++i ) // i: 1->n
          {
              cout << p[i] << "^" << c[i] <<endl;
          }
          return 0;
      }
      ```
    - Pollard Rho 算法
- 因数
  - 求N的正因数集合
    - 试除法
    - 倍数法
  - 最大公因数(公约数)
    - 更相减损术
    - gcd
  - 互质与欧拉函数
  - 积性函数
- 同余
  - 费马小定理
  - 欧拉定理
  - 欧拉定理推论
  - exgcd
  - 乘法逆元
  - 线性同余方程
  - 中国剩余定理
  - 高次同余方程
    - bsgs
- 矩阵乘法
- 组合计数
