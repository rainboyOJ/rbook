# 文章标题双轨：菜单短名与正文长名

菜单栏窄、正文标题可以长，这两个需求不是同一个字段能同时满足的，所以承认一篇文章允许有两个名字，各自有唯一的住处：

- 正文标题 `config.yaml` 的 `title`（可长）——页面 `<title>`、正文 H1、`dist/catalog.json` 都用它，取值链 `title → md front matter title → catalog.yaml title`。
- 菜单短名 `config.yaml` 的 `menu_title`（可选，要短）——侧边栏用它，取值链 `menu_title → catalog.yaml title`；没写就沿用 `catalog.yaml` 里的名字，存量 144 篇因此不需要迁移。目录节点没有文章，只有 `catalog.yaml` 的 `title`。

不新增 `short` 字段：`id` 本来就是英文短名（`topsort`、`presum`、`lis`），拿它当搜索关键词即可。侧边栏搜索因此把四个来源拼起来匹配——菜单名、面包屑、`data-article-id`、`data-article-title`，菜单上仍然只显示短名。

代价与守卫：两轨并存意味着同一个页面会同时出现短名与长名，这是预期行为而不是 bug；为了防止短名把菜单撑爆，`menu_title` 显示宽度超过 32（约 16 个汉字）时 `npm run check:catalog` 报 warning，存量 `catalog.yaml` 里的旧名字不在校验范围内。

严格作用域另行保留：目录 `config.yaml` 只作用于它自己 `file:` 声明的那篇文章，同目录其它 `.md` 读自己的 front matter。

这份决定取代 0012 早先「菜单与正文必须同名」的版本，并修正 0002 里「catalog 承担导航显示名」的部分。

## Status

accepted
