# Fira Code

本目录存放 Typst 文档用到的字体，由 `scripts/build-typst.sh` 通过
`typst compile --font-path assets/fonts` 传给 Typst。

Typst 默认只扫描系统字体目录，仓库自带的字体不放进来就找不到，
会静默回退到其它等宽字体，所以必须显式传 `--font-path`。

| 文件 | 用途 |
| --- | --- |
| `FiraCode-Regular.ttf` | 代码块与行内代码的常规字重 |
| `FiraCode-Bold.ttf` | 代码中粗体 |

## 来源与许可

- 来源：<https://github.com/tonsky/FiraCode/releases/tag/6.2>
- 版本：Fira Code v6.2
- 许可：SIL Open Font License 1.1（OFL-1.1），允许随文档一起分发

Fira Code 没有中文字形，因此所有使用它的地方都必须在字体列表里后备一个中文
字体（本项目后备 `LXGW WenKai`，取自系统已安装的霞鹜文楷），否则代码块里的中文
注释会渲染成方框。

## 注意：连字

Fira Code 默认开启连字（`<=` 显示成 `≤`，`!=` 显示成 `≠`，`->` 显示成 `→`）。
Typst 的 `text(features:)` 只能启用特性、不能关闭，`ligatures: false` 对它也不
生效，所以目前无法在 Typst 里关掉这些连字。如果讲课时需要学生看清原始字符，
需要改用无连字的等宽字体（如 Fira Mono）。
