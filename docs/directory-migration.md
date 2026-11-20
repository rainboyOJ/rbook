# 中文目录英文化

目录统一采用小写英文与下划线。中文标题、文件名、搜索别名和现有 `rbook.id` 保持原样。

| 原目录 | 新目录 |
| --- | --- |
| `book/string/最小表示法` | `book/string/minimal_rotation` |
| `book/string/进制hash` | `book/string/string_hash` |
| `book/math/numberTheory/约数` | `book/math/numberTheory/divisors` |
| `book/greedy/均分纸牌` | `book/greedy/equalize_cards` |
| `book/graph/图论及其应用读书笔记` | `book/graph/graph_theory_notes` |
| `book/dynamic_programming/knapsack/exercises/整数划分` | `book/dynamic_programming/knapsack/exercises/integer_partition` |
| `book/ReadingNotes/近世代数` | `book/ReadingNotes/abstract_algebra` |
| `assets/papers/我的杂记` | `assets/papers/personal_notes` |

`catalog.yaml` 与孤儿文件清单同步更新。`docs/dist-baseline.md` 是迁移前的历史快照，保留当时的路径。

模板下载路径由文章中代码文件相对 `book/` 的路径生成，因此两个字符串模板也迁移到 `code_template/string/minimal_rotation/` 和 `code_template/string/string_hash/`。模板构建前清理 `public/` 下的生成目录，避免旧路径残留；根目录中的手写文件保留。

`deploy/nginx/legacy-paths.conf` 为六篇已发布文章、两个模板目录及论文的 `/papers/`、`/assets/papers/` 入口提供 301 跳转，保留后续路径和查询参数。`deploy.sh` 在同步构建产物后安装该配置；安装时校验 nginx 配置，失败时回滚。执行部署前，线上地址仍使用原路径。开发服务器直接使用新地址，不加载 nginx 跳转规则。

被 Git 忽略的嵌套 `newRbook_ejs/` 副本不在本次迁移范围内。
