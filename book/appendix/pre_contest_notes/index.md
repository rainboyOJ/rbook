[[TOC]]

> CSP-J/S 2026 第二轮：**2026 年 10 月 31 日（周六）**，入门级 08:30 – 12:00，提高级 14:30 – 18:30。
> 比赛环境为 **NOI Linux 2.0（noilinux 2.0）**，编译器 `g++` 9.3.0，默认标准 `C++14`。

这份《比赛赛前注意事项》是 2024 版的重写：删掉了原来整章的虚拟机（VMWare）内容，
比赛环境按 noilinux 2.0 重新整理，补上了环境速查表、常用代码模板、对拍脚本、
时间分配建议和一份可打印的赛前检查清单。

正文以 Typst 排版，下方直接内嵌 PDF，也可以下载下来打印。

## 这篇文档讲什么

| 章 | 内容 |
| --- | --- |
| 1 赛前须知 | 第二轮时间与入场规则、noilinux 2.0 环境速查表、赛前必须练熟的五件事 |
| 2 noilinux 2.0 使用要点 | 开终端、选编辑器、五个最容易踩的坑 |
| 3 简单代码模板 | 通用骨架、`freopen`、01 序列、全排列、DFS 框架、随机数据、对拍脚本、存图、常用命令 |
| 4 考试注意的细节 | 提交清单、常见错误对照表、数据规模与内存、常数优化、时间分配 |
| 附录 A | 赛前检查清单（知识 / 操作 / 考前一天） |

## 阅读 PDF

<p>
  <a class="btn btn-primary" href="/appendix/pre_contest_notes/比赛赛前注意事项.pdf" download>
    下载 PDF
  </a>
  <a class="btn btn-secondary" href="/appendix/pre_contest_notes/比赛赛前注意事项.pdf" target="_blank" rel="noopener">
    新窗口打开
  </a>
</p>

<iframe
  src="/appendix/pre_contest_notes/比赛赛前注意事项.pdf"
  width="100%"
  height="900px"
  style="border: 1px solid #d5dde5; border-radius: 6px;"
  title="比赛赛前注意事项 PDF"
></iframe>

## 三个最容易丢分的地方

::: warning
**忘了 `freopen`。** 程序在本地用标准输入能跑，交上去读不到 `.in`，直接 0 分。
提交前逐个文件确认：文件名与题面**逐字一致**，两行 `freopen` 都已反注释。
:::

::: warning
**考试文件夹名里的短横线写成下划线。** 形如 `AH-J00001`，中间是 `-`（减号），不是 `_`。
:::

::: warning
**调试输出没删干净。** `freopen` 之后所有 `cout` 都会写进 `.out`，多一个字符就是 WA。
:::

## 关于源文件

本文的 Typst 源文件为同目录下的 `比赛赛前注意事项.typ`，由 `scripts/build-typst.sh` 编译。
修改流程：

- 改 `book/appendix/pre_contest_notes/比赛赛前注意事项.typ`；
- 跑 `bash scripts/build-typst.sh`（或 `--force` 强制重编译）；
- 再跑 `npm run build` 或 `npm run dev`，PDF 会被复制进该文章的发布目录。

`build.sh` 与 `deploy.sh` 已经自动调用这个脚本；本机没装 `typst` 时只警告并跳过，
沿用仓库里已提交的上一版 PDF。
