#!/bin/bash
set -euo pipefail

# ── 语音播报 ────────────────────────────────────────────────────────────────
# 复用 family-info-platform 的 say.py：POST 到 n8n webhook → 小米 TTS → PVE 音响。
# 与 rbook_new_problem_solutions/deploy.sh 的 announce 行为一致：
# 局域网不可达 / 没有 say.py / 播报失败，都只打印一行提示并继续，绝不影响发布。
#
# 可用环境变量覆盖：
#   PUSH_SAY_SCRIPT   指定 say.py 路径（默认按下面的候选列表查找）
#   PUSH_SAY_IP       用来做 1s 可达性探测的局域网 IP（默认取 SAY_WEBHOOK 的 host）
#   PUSH_SAY_MESSAGE  播报文案
#   SAY_WEBHOOK       n8n webhook 地址
PUSH_SAY_MESSAGE="${PUSH_SAY_MESSAGE:-主人,RBook 电子书 部署完成}"

say_webhook_host() {
  local webhook host
  webhook="${SAY_WEBHOOK:-http://192.168.9.103:5678/webhook/say}"
  host="${webhook#*://}"
  host="${host%%/*}"
  host="${host##*@}"
  printf '%s\n' "${host%%:*}"
}

# 依次尝试：显式指定 → ~/mybin/say.py（deploy.sh 的约定）→ 仓库里的实际位置
resolve_say_script() {
  local candidate
  for candidate in \
    "${PUSH_SAY_SCRIPT:-}" \
    "$HOME/mybin/say.py" \
    "$HOME/mycode/服务器部署/family-info-platform/scripts/say.py"; do
    if [[ -n "$candidate" && -f "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done
  return 1
}

announce() {
  local message="$1"
  local say_ip say_script
  say_ip="${PUSH_SAY_IP:-$(say_webhook_host)}"

  if ! command -v ping >/dev/null 2>&1; then
    echo "[deploy] 未找到 ping，跳过语音通知" >&2
    return 0
  fi
  if ! ping -c 1 -W 1 "$say_ip" >/dev/null 2>&1; then
    echo "[deploy] 局域网 IP ${say_ip} 在 1s 内不可达，跳过语音通知" >&2
    return 0
  fi
  if ! command -v python3 >/dev/null 2>&1 || ! say_script="$(resolve_say_script)"; then
    echo "[deploy] 找不到 say.py（\$PUSH_SAY_SCRIPT / ~/mybin/say.py / family-info-platform），跳过语音通知" >&2
    return 0
  fi
  if ! python3 "$say_script" "$message"; then
    echo "[deploy] 语音通知失败，但不影响发布结果" >&2
  fi
}

# ── 发布 ───────────────────────────────────────────────────────────────────

# 先编译 TypeScript 发布核心（.tsbuild）。rbook 直接运行编译产物，
# 不先编译就会用到过期的 .tsbuild，导致源码改动不生效。
npx tsc -p tsconfig.publishing.json

npx rbook build --profile full

# .user.ini 由宝塔在服务器端管理（immutable 属性，rsync 删不掉），
# 排除它以免 --delete 每次报 "Operation not permitted"。
rsync -avp --delete --exclude='.user.ini' ./dist/ bohai:/www/wwwroot/rbook.roj.ac.cn

# sync back
#rsync -avzP --delete --exclude=dist/ . pro13:~/mycode/new_rbook_ejs

announce "$PUSH_SAY_MESSAGE"
