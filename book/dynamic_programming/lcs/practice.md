### 基础模板与还原

- <%- pid_to_url('luogu', 'U197280', '【模板】最长公共子序列') %> ([洛谷 U197280](https://www.luogu.com.cn/problem/U197280)) 标准双串二维 DP
- <%- pid_to_url('noiopenjudge', 'ch0206/1808/', '公共子序列') %>
- <%- pid_to_url('leetcodecn', '1143', '最长公共子序列') %> ([LeetCode 1143](https://leetcode.cn/problems/longest-common-subsequence/))
- <%- pid_to_url('luogu', '2758', '编辑距离') %> ([洛谷 P2758](https://www.luogu.com.cn/problem/P2758)) 字符增删改代价转移，双串匹配经典

### 模型转化与方案计数

- <%- pid_to_url('leetcodecn', '1312', '让字符串成为回文串的最少插入次数') %> ([LeetCode 1312](https://leetcode.cn/problems/minimum-insertion-steps-to-make-a-string-palindrome/)) 原串与反转串的 LCS 转化
- <%- pid_to_url('luogu', '2516', '[HAOI2010] 最长公共子序列') %> ([洛谷 P2516](https://www.luogu.com.cn/problem/P2516)) LCS 长度与方案数计数（容斥去重）

### 跨主题进阶优化

- <%- pid_to_url('luogu', '1439', '【模板】最长公共子序列') %> ([洛谷 P1439](https://www.luogu.com.cn/problem/P1439)) 全排列 LCS 映射转 LIS，优化至 $O(n \log n)$