#include <algorithm>

struct discrete {

  int end; //不相同元素后一个位置
  void pre_work() {
      std::sort(a+1,a+1+n);
      end = std::unique(a+1,a+1+n) - a;
  }

  //查询x对应的离散化后的值
  int query(int x) {
      int pos = std::lower_bound(a+1, a+end,x) - a;
      if( a[pos] == x)
          return pos;
      return 0; //没有找到这个数
  }
};
