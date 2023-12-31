// 求i与j之间的距离,不包括j
inline int dis_ex(int i,int j) {
    return j-i; //直接减
}

// 求i与j之间的距离,包括j
inline int dis_in(int i,int j) {
    return dis_ex(i,j)+1; //加上缺少的j
}

//相对位置的计算
struct relative_pos {
    int pos;
    //从v开始向dir方向走n步
    int base_ex(int n,int dir) {
        return pos+n*dir;
    }
    int base_in(int n,int dir) {
        return base_ex(n,dir)-dir; //反方向再走一步
    }

    int next_ex(int n) { return base_ex(n,1); }
    int next_in(int n) { return base_in(n,1); }
    int pre_ex(int n) {return base_ex(n,-1);}
    int pre_in(int n) {return base_in(n,-1);}
};
