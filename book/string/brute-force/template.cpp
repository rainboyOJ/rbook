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
