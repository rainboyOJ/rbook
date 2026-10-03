#include <bits/stdc++.h>
using namespace std;

const int maxn = 1e5 + 5;

string op_sta[maxn]; // 运算符栈
int sta_top = 0;

// 表达式树节点：val 存操作数或运算符，l/r 存左右孩子编号，0 表示空
struct Node {
  string val;
  int l = 0, r = 0;
};
Node tree[maxn];  // 节点池（数组存树）
int node_cnt = 0; // 已使用节点数

bool isOp(const string &t) {
  return t == "+" || t == "-" || t == "*" || t == "/" || t == "^";
}

int prec(const string &op) {
  if (op == "+" || op == "-") return 1;
  if (op == "*" || op == "/") return 2;
  if (op == "^") return 3;
  return -1;
}

bool isRight(const string &op) { return op == "^"; } // 右结合

// 栈顶是否该弹出：左结合 >=，右结合 >
bool shouldPop(const string &top, const string &cur) {
  if (top == "(") return false;
  if (isRight(cur)) return prec(top) > prec(cur);
  return prec(top) >= prec(cur);
}

// 调度场算法：中缀 -> 后缀
vector<string> infixToPostfix(const vector<string> &tokens) {
  vector<string> postfix;
  for (const string &t : tokens) {
    if (!isOp(t) && t != "(" && t != ")") {
      postfix.push_back(t);   // 操作数直接输出
    } else if (t == "(") {
      op_sta[sta_top++] = t;  // 左括号入栈
    } else if (t == ")") {
      while (sta_top > 0 && op_sta[sta_top - 1] != "(")
        postfix.push_back(op_sta[--sta_top]); // 弹到左括号
      sta_top--;              // 丢弃左括号
    } else {
      while (sta_top > 0 && shouldPop(op_sta[sta_top - 1], t))
        postfix.push_back(op_sta[--sta_top]);
      op_sta[sta_top++] = t;  // 当前运算符入栈
    }
  }
  while (sta_top > 0) postfix.push_back(op_sta[--sta_top]);
  return postfix;
}

// 词法分析：把中缀字符串切成 token（数字、小数、变量名、括号、运算符）
vector<string> tokenize(const string &expr) {
  vector<string> tokens;
  int n = expr.size();
  for (int i = 0; i < n;) {
    char c = expr[i];
    if (c == ' ' || c == '\t' || c == '\n' || c == '\r') { i++; continue; }
    if ((c >= '0' && c <= '9') || c == '.') { // 数字
      int j = i;
      while (j < n && ((expr[j] >= '0' && expr[j] <= '9') || expr[j] == '.')) j++;
      tokens.push_back(expr.substr(i, j - i));
      i = j;
    } else if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_') { // 变量名
      int j = i;
      while (j < n && ((expr[j] >= 'a' && expr[j] <= 'z') ||
                       (expr[j] >= 'A' && expr[j] <= 'Z') ||
                       (expr[j] >= '0' && expr[j] <= '9') || expr[j] == '_')) j++;
      tokens.push_back(expr.substr(i, j - i));
      i = j;
    } else {
      tokens.push_back(string(1, c)); // 运算符/括号
      i++;
    }
  }
  return tokens;
}

// 新建节点，返回编号
int newNode(const string &v) {
  tree[++node_cnt].val = v;
  tree[node_cnt].l = tree[node_cnt].r = 0;
  return node_cnt;
}

// 后缀表达式 -> 表达式树，返回根节点编号
int buildExprTree(const vector<string> &postfix) {
  int node_sta[maxn]; // 节点栈，存节点编号
  int top = 0;
  for (const string &t : postfix) {
    if (!isOp(t)) {
      node_sta[top++] = newNode(t); // 操作数 -> 叶子入栈
    } else {
      int r = node_sta[--top];      // 先弹出的是右操作数
      int l = node_sta[--top];      // 再弹出的是左操作数
      int root = newNode(t);
      tree[root].l = l;
      tree[root].r = r;
      node_sta[top++] = root;       // 新子树入栈
    }
  }
  return node_sta[--top];           // 栈中最后一个就是根
}

// 后序遍历：左-右-根，恰好还原出后缀表达式
void postOrder(int u) {
  if (u == 0) return;
  postOrder(tree[u].l);
  postOrder(tree[u].r);
  cout << tree[u].val << ' ';
}

// 中序遍历：左-根-右，还原出中缀表达式（未处理括号，仅作示意）
void inOrder(int u) {
  if (u == 0) return;
  inOrder(tree[u].l);
  cout << tree[u].val << ' ';
  inOrder(tree[u].r);
}

int main() {
  string expr;
  getline(cin, expr);

  vector<string> postfix = infixToPostfix(tokenize(expr));
  cout << "后缀: ";
  for (const string &t : postfix) cout << t << ' ';
  cout << '\n';

  int root = buildExprTree(postfix);
  cout << "后序遍历: ";
  postOrder(root);
  cout << '\n';
  cout << "中序遍历: ";
  inOrder(root);
  cout << '\n';
}
