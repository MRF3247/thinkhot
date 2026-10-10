#!/usr/bin/env bash
# 把 ThinkHOT 的静态快照生成并推到 GitHub Pages（https://mrf3247.github.io/thinkhot/）。
# 一天三次（9:00 / 12:00 / 15:00）由 launchd 调，也可手动跑：./snapshot.sh
#
# 为什么这么做：Cloudflare 快速隧道那台机器到边缘的链路会被网络挡掉，地址还每次重启都变；
# 静态快照推到 GitHub 后地址固定、不依赖隧道，代价是「不是实时」，粒度=推送频率。
set -uo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
STATE="$ROOT/.publish"
SNAP="$STATE/pages"
WEB_PORT="${SNAPSHOT_WEB_PORT:-3120}"
API_PORT="${SNAPSHOT_API_PORT:-3021}"
API_BASE="http://127.0.0.1:$API_PORT"
PREFIX="/thinkhot"
PAGES_URL="https://mrf3247.github.io$PREFIX"
REMOTE="${SNAPSHOT_REMOTE:-git@github.com:MRF3247/thinkhot.git}"
BRANCH="gh-pages"
NODE_BIN="${NODE_BIN:-$(command -v node || echo /Users/Jin/.hermes/node/bin/node)}"
LOG="$STATE/snapshot.log"

mkdir -p "$STATE"
log() { echo "[$(date '+%F %T')] $*" | tee -a "$LOG"; }

# --- 1. 本地服务得活着：api 不在就整体拉起，生产 web 不在（或 SITE_URL 不对）就重起一个 ---
if ! curl -s -o /dev/null -m 5 "$API_BASE/api/site/hot"; then
  log "api 没在跑，先 ./thinkhot.sh start"
  ( cd "$ROOT" && ./thinkhot.sh start ) >>"$LOG" 2>&1
  sleep 6
fi
need_web=0
curl -s -o /dev/null -m 5 "http://127.0.0.1:$WEB_PORT/" || need_web=1
# 以前给隧道起过的话 SITE_URL 指向死掉的隧道地址，canonical/og 会错，要按 Pages 地址重起
[ "$(cat "$STATE/web.site_url" 2>/dev/null)" = "$PAGES_URL" ] || need_web=1
if [ "$need_web" = 1 ]; then
  log "起生产 web（端口 ${WEB_PORT}，SITE_URL=${PAGES_URL}）"
  for p in $(lsof -ti tcp:"$WEB_PORT" -sTCP:LISTEN 2>/dev/null); do kill "$p" 2>/dev/null; done
  sleep 1
  [ -f "$ROOT/apps/web/build/server/index.js" ] || ( cd "$ROOT/apps/web" && npm run build ) >>"$LOG" 2>&1
  ( cd "$ROOT/apps/web" && WEB_PORT="$WEB_PORT" API_BASE_URL="$API_BASE" SITE_URL="$PAGES_URL" \
      nohup "$NODE_BIN" server.ts >>"$STATE/web.log" 2>&1 & echo $! >"$STATE/web.pid" )
  printf '%s' "$PAGES_URL" >"$STATE/web.site_url"
  for _ in $(seq 1 30); do curl -s -o /dev/null -m 5 "http://127.0.0.1:$WEB_PORT/" && break; sleep 1; done
fi

# --- 2. 生成快照 ---
rm -rf "$SNAP"
log "开始抓取快照…"
python3 "$ROOT/snapshot.py" --base "http://127.0.0.1:$WEB_PORT" --prefix "$PREFIX" --out "$SNAP" >>"$LOG" 2>&1
rc=$?
if [ $rc -ne 0 ] || [ ! -f "$SNAP/index.html" ]; then log "❌ 快照失败（rc=${rc}）"; exit 1; fi
pages="$(find "$SNAP" -name index.html | wc -l | tr -d ' ')"
log "快照完成：$pages 页"

# --- 3. 推到 gh-pages（每次 force push 一个提交，仓库不会越滚越大）---
cd "$SNAP"
[ -d .git ] || git init -q
git checkout -q -B "$BRANCH" 2>/dev/null || git checkout -q -B "$BRANCH"
git add -A
git -c user.name="ThinkHOT snapshot" -c user.email="snapshot@local" commit -q -m "snapshot $(date '+%F %H:%M') · $pages 页" || log "（没有变化，跳过提交）"
git remote get-url origin >/dev/null 2>&1 || git remote add origin "$REMOTE"
git remote set-url origin "$REMOTE"
if git push -q -f origin "$BRANCH" 2>>"$LOG"; then
  log "✅ 已推送 $BRANCH → $PAGES_URL"
else
  log "❌ 推送失败，看 $LOG"
  exit 1
fi
