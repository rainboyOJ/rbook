#include <iostream>
using namespace std;
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

//从pos这个位置开始查找s中p第一次出现的位置
// return -1 表示没有找到
int bf_find(string &s,string & p,int pos = 0)
{
  int i = pos;
  int j = 0;

  while( i < s.length() && j < p.length()) //没有超过位置
  {
    if(s[i] == p[j]) {
      i++;j++;
    }
    else {
      i = relative_pos(i).pre_ex(j)+1;//见解释
      j = 0;
    }
  }
  if( j == p.length()) { //匹配成功
    return relative_pos(i).pre_in(j); //向前走j个元素
  }
  return -1;
}

int main() {
  return 0;
}
