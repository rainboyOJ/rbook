#!/bin/bash
set -euo pipefail

# 先编译 TypeScript 发布核心（.tsbuild）。rbook 直接运行编译产物，
# 不先编译就会用到过期的 .tsbuild，导致源码改动不生效。
npx tsc -p tsconfig.publishing.json

npx rbook build --profile full

# .user.ini 由宝塔在服务器端管理（immutable 属性，rsync 删不掉），
# 排除它以免 --delete 每次报 "Operation not permitted"。
rsync -avp --delete --exclude='.user.ini' ./dist/ bohai:/www/wwwroot/rbook.roj.ac.cn

# sync back
#rsync -avzP --delete --exclude=dist/ . pro13:~/mycode/new_rbook_ejs
