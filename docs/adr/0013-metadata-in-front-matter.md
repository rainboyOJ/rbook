# 文章元数据迁入 md 的 front matter

`config.yaml` 是**目录级**的，这带来两个结构性代价：扁平的 `.md` 文章（`graph/preface.md`、`utils/log.md` 这类）没法拥有任何元数据；一个目录里放两篇文章时，配置只能描述其中一个，另一篇的 `title` / `id` 会被邻居静默覆盖（`vscode/deepseek.md` 就这样变成了「vscode的使用」）。再加上 145 份配置里有 46 份只有 `id/title/file` 三行、142 份的 `file` 是纯样板 `index.md`，目录级配置的收益已经小于它的维护成本。

现在把元数据写进 md 自己的 front matter：顶层放 `title`（正文标题，可以长）与 `menu_title`（菜单短名，可选），其余构建字段（`id` / `pre` / `copy` / `practice` / `code_template` / `teach_plan` / `typst` …）放在 `rbook:` 子键里。`config.yaml` 一次性下线，不留兼容读取，避免出现第二个来源；顶层误写构建字段会被忽略并报警告。目录叶子仍然默认读 `index.md`，`.md` 叶子读文件本身，因此「一份元数据只描述一个文件」成了类型级的事实。

连带影响：`check:catalog` 的孤儿分类改为按 front matter 判断（有 `rbook.id` = 自称文章却没挂目录的 P0 债务，有 `title` = 待人工判断，两者都没有 = 素材）；`scripts/build-typst.sh` 与 `third_part/code_template_filter` 改从 front matter 读声明。迁移脚本 `scripts/migrate-config-to-frontmatter.cjs` 是一次性的，保留在仓库里备查。

## Status

accepted
