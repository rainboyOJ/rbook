#include <bits/stdc++.h>
using namespace std;

const int maxn = 1e5 + 5;

string op_sta[maxn]; // 运算符栈
int sta_top = 0;     // 栈顶指针

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

vector<string> infixToPostfix(const vector<string> &tokens) {
  vector<string> postfix;
  for (const string &t : tokens) {
    if (!isOp(t) && t != "(" && t != ")") {
      postfix.push_back(t);          // 操作数直接输出
    } else if (t == "(") {
      op_sta[sta_top++] = t;         // 左括号入栈
    } else if (t == ")") {
      while (sta_top > 0 && op_sta[sta_top - 1] != "(")
        postfix.push_back(op_sta[--sta_top]); // 弹到左括号
      sta_top--;                     // 丢弃左括号
    } else {
      while (sta_top > 0 && shouldPop(op_sta[sta_top - 1], t))
        postfix.push_back(op_sta[--sta_top]);
      op_sta[sta_top++] = t;         // 当前运算符入栈
    }
  }
  while (sta_top > 0) postfix.push_back(op_sta[--sta_top]);
  return postfix;
}

// 词法分析：把中缀字符串切成 token（支持数字、小数、变量名、括号、运算符）
vector<string> tokenize(const string &expr) {
  vector<string> tokens;
  int n = expr.size();
  for (int i = 0; i < n;) {
    char c = expr[i];
    if (c == ' ' || c == '\t' || c == '\n' || c == '\r') { i++; continue; }
    if ((c >= '0' && c <= '9') || c == '.') {           // 数字
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
      tokens.push_back(string(1, c));                   // 运算符/括号
      i++;
    }
  }
  return tokens;
}

int main() {
  string expr;
  getline(cin, expr);
  vector<string> postfix = infixToPostfix(tokenize(expr));
  for (const string &t : postfix) cout << t << ' ';
  cout << '\n';
}
