# 题目链接统一走 pcs2 与各 OJ 官方站

rbook 正文里的题目引用统一为 `[[[p: oj-pid]]]`，URL 与标题由一个解析器按固定路由产出：`roj` 走 `https://roj.ac.cn/problem/{id}`（老 ROJ 题只有该站有），其余 OJ 走 `https://pcs2.roj.ac.cn/problems/{oj}/{pid}/`；题库仓库未收录的题回退到该 OJ 官方站。标题优先取自 sibling 题库仓库的 front matter，缺失时用 `[[[p: oj-pid | 标题]]]` 的内联标题，再退化为裸 id。

## Context

正文原先有两套互不相干的题目链接机制：

- `pid_to_url(oj, id, title)` 内容宏，78 处，标题在正文里手写。它拼 `${base}${oj}/${id}`，即 `https://roj.ac.cn/luogu/1540`。
- `[[[p: id]]]` 语法，463 处，依赖构建期加载的题库数据库。

实测两者在线上**全部 404**：`roj.ac.cn/luogu/1540`、`roj.ac.cn/roj/1262`、`roj.ac.cn/leetcodecn/225` 均不可达。题库 provider 也因 `lokijs` 缺失与数据库路径错误而从未成功加载，导致 463 个 `[[[p:]]]` 渲染成 `extra-link missing`。

同时 rbook 引用的 oj 与目标站点并非一一对应：pcs2 只收录 17 道 roj 题（编号 19996+），而 rbook 引用的 243 道是编号 1260–8008 的老题；`noj` 的编号体系与 luogu 不同名同义（`roj.ac.cn/problem/1048` 是另一道题）。

## Decision

引入 `ProblemUrlResolver`，把 `(oj, pid)` 解析为 URL 与标题，路由规则：

| 条件 | 目标 |
|---|---|
| `oj === 'roj'` | `{ROJ_BASE}/problem/{pid}`（无尾斜杠） |
| 题库仓库收录 | `{PCS2_BASE}/problems/{oj}/{pid}/`（有尾斜杠） |
| 仓库未收录 | 各 OJ 官方站（luogu.com.cn / acwing.com / vjudge.net / noi.openjudge.cn 等） |

配套规则：

- **oj 别名**：`noiopenjudge` → `noi_openjudge`（历史合法写法，不报错）；`awcing` → `acwing`（明确笔误，发 warning）。
- **pid 规范化**：luogu 补 `P` 前缀（`1048` → `P1048`）；`noi_openjudge` 的 `/` 转 `-`；`leetcodecn` 的数字题号查静态表翻译为 slug（`724` → `find-pivot-index`，因为 `leetcode.cn/problems/724/` 返回 404）。
- **语法**：统一 `[[[p: oj-pid]]]`，可选 `[[[p: oj-pid | 标题]]]`；`[[[pp:]]]` 等同 `p` 并发弃用 warning（其 `✓` 原本依赖题库的 `hasSolution`，不再可用）。
- **base 可配置**：默认常量，可用环境变量 `RBOOK_PCS2_BASE` / `RBOOK_ROJ_BASE` 覆盖。

标题数据在构建期直接读取 sibling 仓库 `../rbook_new_problem_solutions/problems/*/*/index.md` 的 front matter；仓库缺失时降级为裸 id 并发 warning，不阻断构建。

## Consequences

- 541 个题目引用从全部 404 变为可用；`extra-link missing` 由 190 降至 0。
- rbook 构建新增对 sibling 仓库的软依赖：不存在时仍能构建，但标题退化为裸 id。
- `leetcodecn` 的数字→slug 依赖一份静态表（`book/problem-sources/leetcodecn-slugs.json`），需用 `npm run gen:leetcodecn-slugs` 定期刷新。
- 题库仓库未收录的题（luogu 41、acwing 62、leetcodecn 3）指向各 OJ 官方站，而非 pcs2。这些链接在官方站可用，但不落在自有体系内；后续把这些题补进题库后会自动切回 pcs2。
- `awcing` 拼写错误仍在源文件中（2 处），仅由 warning 提示，需内容侧修正。
