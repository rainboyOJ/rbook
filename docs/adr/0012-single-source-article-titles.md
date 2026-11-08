# 文章标题收敛为单一来源

文章标题原本有三个来源：`catalog.yaml` 的导航名、目录 `config.yaml` 的 title、md frontmatter 的 title。侧边栏只读第一个，页面标题与 `dist/catalog.json` 读后两个，于是 134 篇有 config 的文章里有 52 篇在同一个页面上出现两个名字（侧边栏「排序不等于式」，正文「排序不等式」），另有 `vscode/deepseek.md` 因为同目录 config 一起生效而被改成了兄弟文章的标题。现在统一为一条优先级 `config.yaml title → md frontmatter title → catalog.yaml title`，页面、侧边栏、对外清单三处都从它派生；`catalog.yaml` 的 title 退化为兜底，只在文章既没有 config 也没有 frontmatter 时生效。同时规定目录 config 只作用于它自己 `file:` 声明的那篇文章，兄弟 md 不再被静默覆盖。

这份决定修正了 0002 中「catalog 承担导航显示名」的部分：目录仍然承担层级、顺序、分组与兜底标题，但不再与文章标题各自为政。

## Status

accepted
