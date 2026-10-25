#!/bin/bash
# 旧的 build.sh — 现在只负责调用新的发布管线
# 所有业务步骤已移入 src/publishing/cli 的 build 命令

set -uo pipefail

# Typst 源 -> PDF。必须跑在 rbook build 之前：发布管线按 config 的 copy 字段
# 把 PDF 复制进 dist，PDF 不存在会报 error 级诊断。
bash ./scripts/build-typst.sh || exit 1

exec npx rbook build --profile full
