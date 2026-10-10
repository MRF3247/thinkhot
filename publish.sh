#!/usr/bin/env bash
# 把 ThinkHOT 的网页版发到公网：生产版 web 服务器 + Cloudflare 快速隧道（免费、不需要买域名）。
#
#   ./publish.sh build    构建生产版网页（改了代码之后要跑）
#   ./publish.sh start    起隧道 + 生产 web，打印公网地址
#   ./publish.sh restart  重启（换了机器/崩了就用这个）
#   ./publish.sh status   看当前地址和存活情况
#   ./publish.sh stop     全停
#
# 注意：快速隧道的地址是随机的，**每次重启都会换**。地址写在 .publish/url.txt。
set -uo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
CF="${CF_BIN:-$HOME/Documents/Open Programs/cloudflared/cloudflared}"
WEB_PORT="${PUBLISH_WEB_PORT:-3120}"
API_BASE="${PUBLISH_API_BASE:-http://127.0.0.1:3021}"
STATE="$ROOT/.publish"
WEB_LOG="$STATE/web.log"
CF_LOG="$STATE/tunnel.log"
URL_FILE="$STATE/url.txt"
NODE_BIN="${NODE_BIN:-$(command -v node || echo /Users/Jin/.hermes/node/bin/node)}"

mkdir -p "$STATE"

alive()  { [ -n "${1:-}" ] && kill -0 "$1" 2>/dev/null; }
pid_of() { cat "$STATE/$1.pid" 2>/dev/null || true; }
kill_one() {
  local p; p="$(pid_of "$1")"
  if alive "$p"; then kill "$p" 2>/dev/null; sleep 1; alive "$p" && kill -9 "$p" 2>/dev/null; fi
  rm -f "$STATE/$1.pid"
}
# 只取「监听者」：不加 -sTCP:LISTEN 会把连着这个端口的隧道进程一起列出来，误杀。
port_pid() { lsof -ti tcp:"$1" -sTCP:LISTEN 2>/dev/null || true; }

stop() {
  kill_one tunnel
  kill_one web
  for p in $(port_pid "$WEB_PORT"); do kill "$p" 2>/dev/null; done
  echo "已停止（隧道 + web）"
}

start() {
  [ -x "$CF" ] || { echo "找不到 cloudflared：$CF"; exit 1; }
  [ -f "$ROOT/apps/web/build/server/index.js" ] || { echo "还没构建，先跑 ./publish.sh build"; exit 1; }
  stop >/dev/null 2>&1

  echo "1/3 起隧道（指向 127.0.0.1:${WEB_PORT}）…"
  : > "$CF_LOG"
  ( cd "$(dirname "$CF")" && nohup "$CF" tunnel --no-autoupdate --url "http://127.0.0.1:$WEB_PORT" >>"$CF_LOG" 2>&1 & echo $! >"$STATE/tunnel.pid" )
  local url="" i
  for i in $(seq 1 40); do
    url="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$CF_LOG" 2>/dev/null | head -1)"
    [ -n "$url" ] && break
    sleep 1
  done
  if [ -z "$url" ]; then echo "隧道地址没出来，看 $CF_LOG"; exit 1; fi
  printf '%s' "$url" >"$URL_FILE"
  echo "    地址：$url"
  # 地址是隧道进程一开始就打印的，此时还没连上 Cloudflare 边缘，要等它注册完再接客。
  for i in $(seq 1 30); do
    grep -q "Registered tunnel connection" "$CF_LOG" && break
    sleep 1
  done

  echo "2/3 起生产 web（端口 ${WEB_PORT}，SITE_URL=${url}）…"
  : > "$WEB_LOG"
  ( cd "$ROOT/apps/web" && WEB_PORT="$WEB_PORT" API_BASE_URL="$API_BASE" SITE_URL="$url" \
      nohup "$NODE_BIN" server.ts >>"$WEB_LOG" 2>&1 & echo $! >"$STATE/web.pid" )

  echo "3/3 等它通…"
  for i in $(seq 1 30); do
    [ "$(curl -s -o /dev/null -w '%{http_code}' -m 5 "http://127.0.0.1:$WEB_PORT/")" = "200" ] && break
    sleep 1
  done
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' -m 30 "$url/")"
  if [ "$code" = "200" ]; then
    echo "✅ 上线：$url"
  else
    echo "⚠️ 本地通了但公网返回 ${code}，稍等几秒再看 ./publish.sh status（日志 ${WEB_LOG}）"
  fi
}

status() {
  local url; url="$(cat "$URL_FILE" 2>/dev/null)"
  echo "地址：${url:-（没启动过）}"
  echo "隧道进程：$(alive "$(pid_of tunnel)" && echo 在 || echo 不在)"
  echo "web 进程：$(alive "$(pid_of web)" && echo 在 || echo 不在)"
  echo "本地 127.0.0.1:${WEB_PORT}：$(curl -s -o /dev/null -w '%{http_code}' -m 5 "http://127.0.0.1:$WEB_PORT/" || echo 不通)"
  [ -n "$url" ] && echo "公网：$(curl -s -o /dev/null -w '%{http_code}' -m 25 "$url/" || echo 不通)"
}

# 只重启 web，不碰隧道：公网地址保持不变（隧道一直指着这个端口）。
web_only() {
  local url; url="$(cat "$URL_FILE" 2>/dev/null)"
  if [ -z "$url" ]; then echo "还没有公网地址，先跑 ./publish.sh start"; exit 1; fi
  kill_one web
  for p in $(port_pid "$WEB_PORT"); do kill "$p" 2>/dev/null; done
  sleep 1
  : > "$WEB_LOG"
  ( cd "$ROOT/apps/web" && WEB_PORT="$WEB_PORT" API_BASE_URL="$API_BASE" SITE_URL="$url" \
      nohup "$NODE_BIN" server.ts >>"$WEB_LOG" 2>&1 & echo $! >"$STATE/web.pid" )
  local i
  for i in $(seq 1 30); do
    [ "$(curl -s -o /dev/null -w '%{http_code}' -m 5 "http://127.0.0.1:$WEB_PORT/")" = "200" ] && break
    sleep 1
  done
  echo "本地 ${WEB_PORT}：$(curl -s -o /dev/null -w '%{http_code}' -m 5 "http://127.0.0.1:$WEB_PORT/")"
}

# 改了前端代码后：重建 + 只重启 web。隧道不动，公网地址保持不变。
reload() {
  echo "1/2 重建前端…"
  ( cd "$ROOT/apps/web" && npm run build ) || exit 1
  echo "2/2 重启 web（隧道保持，地址不变）…"
  web_only
  local url; url="$(cat "$URL_FILE" 2>/dev/null)"
  echo "✅ 已更新：${url}（公网 $(curl -s -o /dev/null -w '%{http_code}' -m 30 "$url/")）"
}

case "${1:-status}" in
  build)   cd "$ROOT/apps/web" && npm run build ;;
  start)   start ;;
  restart) start ;;
  reload)  reload ;;
  web)     web_only ;;
  stop)    stop ;;
  status)  status ;;
  logs)    tail -n "${2:-30}" "$WEB_LOG"; echo "--- 隧道 ---"; tail -n "${2:-30}" "$CF_LOG"; ;;
  *)       echo "用法: $0 build|start|restart|reload|web|stop|status|logs"; exit 1 ;;
esac
