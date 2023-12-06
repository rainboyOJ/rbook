#include <bits/stdc++.h>
using namespace std;

std::string s;
std::string p;
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

int str_find(std::string &s,std::string & p) {
  int end_pos = relative_pos(s.length()-1).pre_in(p.length());
  for(int i = 0;i <= end_pos;i++)
  {
    int j =0;
    for(;j<p.length();j++) if(s[i+j] != p[j]) break;
    if( j == p.length()) return i;
  }
  return -1;
}
