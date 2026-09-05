#!/bin/bash
# 旧的 build.sh — 现在只负责调用新的发布管线
# 所有业务步骤已移入 src/publishing/cli 的 build 命令

exec npx rbook build --profile full
