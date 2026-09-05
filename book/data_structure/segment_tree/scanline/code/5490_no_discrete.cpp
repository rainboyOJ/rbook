#include <bits/stdc++.h>
using namespace std;

typedef long long ll;

#define maxn 500
int n;

int set_range_start;
int set_range_end;

struct _seg {
    int s,t,h;
    bool down;

    bool operator<(const _seg & other) {
        return h < other.h;
    }
};
_seg seg[5000];
int s_idx;

// ==================== sgt
struct _sgt {

    int tr[maxn*4+5];
    int flag[maxn*4+5];

    int mid(int l,int r) { return (l+r)>>1;}

    int lson(int rt) { return rt<<1;}
    int rson(int rt) { return (rt<<1)|1;}

    void build(int l,int r,int rt) {
        // TODO
    }

    void pushup(int l,int r,int rt) {
        if( flag[rt]) {
            tr[rt] = r-l+1;
        }
        else if(l == r) { //没有孩子
            tr[rt] = 0;
        } else { // 有孩子
            tr[rt] = tr[lson(rt)] +tr[rson(rt)];
        }
    }

    void update_range(int L,int R,int add,int l = set_range_start,int r = set_range_end,int rt=1) {
        if( L <= l && r <=R) {
            flag[rt] += add;
            pushup(l,r,rt);
            return ;
        }

        int m = mid(l,r);
        if( L <= m) update_range(L,R,add,l,m,lson(rt));
        if( R>=m+1) update_range(L,R,add,m+1,r,rson(rt));
        pushup(l,r,rt);
    }

    //一定查询 根
    int query(){
        return tr[1];
    }


} sgt;
// ==================== sgt end

void init(){
    cin >> n;
    int x1,y1;
    int x2,y2;

    for(int i =1;i<=n;i++){
        cin >> x1 >> y1;
        cin >> x2 >> y2;
        seg[++s_idx] = {x1,x2-1,y1,1};
        seg[++s_idx] = {x1,x2-1,y2,0};
    }

}

int main(){
    init();
    sort(seg+1,seg+1+n*2);
    ll sum = 0;
    int pre_len = 0;
    int pre_h = 0;

    //设定的sgt的区间长，
    // 这里对样例是够用的
    set_range_start = 1;
    set_range_end = 500;

    for(int i =1;i<=n*2;i++) {
        // cout << seg[i].s << " ";
        // cout << seg[i].t << " ";
        // cout << seg[i].h << " ";
        // cout << seg[i].down << " ";
        // cout <<endl;

        if( seg[i].down ) {
            sgt.update_range(seg[i].s,seg[i].t,1);
        }
        else {
            sgt.update_range(seg[i].s,seg[i].t,-1);
        }
        int len = sgt.query();
        int h = seg[i].h - pre_h;
        sum += pre_len * h;

        pre_len = len;
        pre_h = seg[i].h;

    }
    cout << sum <<endl;

    return 0;
}
