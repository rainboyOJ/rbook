/* author: Rainboy email: rainboylvx@qq.com  time: 2020年 12月 07日 星期一 16:52:11 CST */
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const int maxn = 1e6+5,maxe = 1e6+5; //点与边的数量

int n,m;
vector<int> v;

int main(){
    v.push_back(0); //占位
    scanf("%d%d",&n,&m);
    for(int i=1;i<=n;++i){
        int t;
        scanf("%d",&t);
        v.push_back(t);
    }
    for(int i=1;i<=m;++i){
        int o,x,y,z;
        scanf("%d",&o);
        if( o ==1 ) {
            scanf("%d%d",&x,&y);
            v[x] +=y;
        }
        else {
            scanf("%d%d",&x,&y);
            int sum=0;
            for(int i=x;i<=y;++i) sum+=v[i];
            printf("%d\n",sum);
        }
    }
    return 0;
}
