#!/bin/bash
# 安装 /papers/ 的 nginx location 到 bohai 的 extension 目录。
#
# 为什么单独一个脚本：deploy.sh 只负责把 dist/ 同步上去，不改服务器配置。
# 但 /papers/ 需要一段 location，而这段不能写进主 vhost 配置——那是宝塔面板
# 托管的地盘，面板保存设置时会重写。放进 extension/ 目录才稳定。
#
# 幂等：内容没变就不动文件、不 reload。改了就备份旧的再装。
# 失败不阻断发布（配置问题不该让整站部署失败），但会明确打警告。

set -uo pipefail

REMOTE="${RBOOK_NGINX_REMOTE:-bohai}"
REMOTE_DIR="/www/server/panel/vhost/nginx/extension/rbook.roj.ac.cn"
REMOTE_FILE="$REMOTE_DIR/papers.conf"
LOCAL_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/deploy/nginx/papers.conf"

if [[ ! -f "$LOCAL_FILE" ]]; then
  echo "[nginx-papers] 找不到 $LOCAL_FILE，跳过" >&2
  exit 0
fi

if ! ssh -o BatchMode=yes -o ConnectTimeout=10 "$REMOTE" true 2>/dev/null; then
  echo "[nginx-papers] 连不上 $REMOTE，跳过 /papers/ 配置安装" >&2
  exit 0
fi

# 先看看远端现有内容。不存在时给个空串，让下面的比较走"不一致"分支。
remote_existing="$(ssh -o BatchMode=yes "$REMOTE" "cat '$REMOTE_FILE' 2>/dev/null" || true)"
local_content="$(cat "$LOCAL_FILE")"

if [[ "$remote_existing" == "$local_content" ]]; then
  echo "[nginx-papers] 配置无变化，跳过"
  exit 0
fi

# 备份旧的（如果有），带时间戳，出问题好回滚。
if ssh -o BatchMode=yes "$REMOTE" "test -f '$REMOTE_FILE'"; then
  stamp="$(date +%Y%m%d%H%M%S)"
  ssh -o BatchMode=yes "$REMOTE" "cp '$REMOTE_FILE' '$REMOTE_FILE.bak.$stamp'" || {
    echo "[nginx-papers] 备份旧配置失败，中止以免无法回滚" >&2
    exit 1
  }
  echo "[nginx-papers] 已备份旧配置到 $REMOTE_FILE.bak.$stamp"
fi

ssh -o BatchMode=yes "$REMOTE" "mkdir -p '$REMOTE_DIR' && cat > '$REMOTE_FILE'" < "$LOCAL_FILE" || {
  echo "[nginx-papers] 写入 $REMOTE:$REMOTE_FILE 失败" >&2
  exit 1
}

# 写完必须 nginx -t。语法错就回滚，绝不能让一个坏配置留在服务器上。
if ! ssh -o BatchMode=yes "$REMOTE" 'nginx -t' 2>&1 | tail -2; then
  echo "[nginx-papers] nginx -t 失败，回滚" >&2
  ssh -o BatchMode=yes "$REMOTE" "
    latest=\$(ls -t '$REMOTE_FILE'.bak.* 2>/dev/null | head -1)
    if [[ -n \"\$latest\" ]]; then mv \"\$latest\" '$REMOTE_FILE'; else rm -f '$REMOTE_FILE'; fi
  "
  exit 1
fi

ssh -o BatchMode=yes "$REMOTE" 'nginx -s reload' || {
  echo "[nginx-papers] nginx reload 失败" >&2
  exit 1
}

echo "[nginx-papers] 已安装并 reload：$REMOTE:$REMOTE_FILE"
