
template<typename T,int N = maxn>
struct heap {
    int size = 0;
    T a[N];
    void clear() {
        size = 0;
    }

    int lson(int t) { return t<<1;}
    int rson(int t) { return (t<<1)|1;}
    int fa(int t) { return t>>1;}
    bool empty() const { return size == 0; }

    void up(int p) {
        while( p > 1) {
            //TODO 这里使用less,greater
            if(a[p] > a[fa(p)]){
                swap(a[p],a[fa(p)]);
                p = fa(p);
            }
            else break;
        }
    }

    void down(int p) {
        int l = lson(p); //左孩子坐标

        //当左孩子存在时
        while( l <= size) {
            int r = rson(p);
            //取左右两者的最大值(最优值),默认l最优
            if( r <= size && a[l] < a[r] )
                l = r;
            if( a[l]  > a[p]){
                swap(a[l],a[p]);
                p = l;
                l = lson(p); //变成新的左孩子
            }
            else break;
        }
    }

    void add(int v) {
        size++;
        a[size] = v;
        up(size);
    }

    T top() {
        return a[1];
    }

    void pop() {
        a[1] = a[size];
        size--;
        down(1);
    }

    //替换在位置p上的值,可能向上调整,也可以向下
    void remove(int p){
        a[p] = a[size];
        size--;
        up(p);
        down(p);
    }

};
