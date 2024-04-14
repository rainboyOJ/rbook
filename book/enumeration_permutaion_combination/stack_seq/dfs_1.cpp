#include <bits/stdc++.h>
using namespace std;
int n;
const int maxn=100;

//栈
template<typename T = int,int siz = maxn>
struct mystack{
  T sta[siz+5];
  int head = 0;

  void clear() { head = 0;}

  void push(T a) { sta[head++] = a;}

  void pop(){head--;}

  T top() { return sta[head-1];}

  bool empty() { return head == 0;}

  int size() { return head;}
};

// sta1 表示等待入栈的队列
// sta2 表示栈内
mystack<int> sta1,sta2;



int dfs() {
  //边界: 等待入栈的队列为空
  if(sta1.empty()) {
    return 1;
  }

  //操作1: 从等待队列取一无元素入栈
  int a = sta1.top();
  sta1.pop();
  sta2.push(a);
  int cnt = 0;
  cnt += dfs();
  sta1.push(a); // 恢复现场
  sta2.pop();

  //操作2: 出栈,前提条件:栈内有元素
  if( !sta2.empty()){
    a = sta2.top();
    sta2.pop();
    cnt+=dfs();
    sta2.push(a); // 恢复现场
  }
  return cnt;
}

int main() {
  cin >> n;
  for(int i =n;i>=1;i--) {
    sta1.push(i);
  }
  int ans = dfs();
  cout << ans;
  return 0;
}