#!/usr/bin/env python3
"""把一个站（本机生产 web）的页面抓成静态快照，供 GitHub Pages 托管。

用法:
  python3 snapshot.py --base http://127.0.0.1:3100 --prefix /medhot --out /tmp/site-medhot

做什么:
  1. 抓固定页 + 榜单/列表页里的详情页（限条数），SSR 出来的是完整 HTML
  2. 下载页面引用的本站资源（/assets、/og、图标、/api/img-proxy 签名头像）—— 签名头像是会过期的，必须落地成本地文件
  3. 把根绝对路径改写成 Pages 子路径（/medhot/...）；SSR 载荷（JSON 字符串）里的转义反斜杠原样保留，别写坏它
  4. 输出 index.html / <route>/index.html
"""
from __future__ import annotations
import argparse, hashlib, json, os, re, sys, urllib.parse, urllib.request

UA = "HOT-Snapshot/1.0"

def get(url: str, timeout: int = 30):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read(), r.status, dict(r.headers)

def norm(u: str) -> str:
    return u.replace("\\u0026", "&").replace("&amp;", "&").replace("&quot;", '"')

# 匹配 "站内绝对路径"，尾巴上可能跟一串 JSON 转义反斜杠（SSR 载荷里）
URL_RE = re.compile(r'(["\'(])(/(?!/)[^"\')\s]*?)(\\*)(?=["\')\s]|$)')

def iter_refs(text: str):
    for m in URL_RE.finditer(text):
        yield m.group(1), norm(m.group(2)), m.group(3)

def ext_of(src: str) -> str:
    ext = os.path.splitext(urllib.parse.urlsplit(src).path)[1].lower()
    return ext if ext in (".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".ico") else ".png"

def route_to_path(route: str) -> str:
    r = urllib.parse.urlsplit(route).path.strip("/")
    return "index.html" if not r else f"{r}/index.html"

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", required=True)
    ap.add_argument("--prefix", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--max-stories", type=int, default=40)
    ap.add_argument("--max-items", type=int, default=25)
    ap.add_argument("--max-dailies", type=int, default=6)
    ap.add_argument("--routes", default="/,/hot,/daily,/all,/topics,/preprints,/agent,/about,/changelog")
    ap.add_argument("--pages-url", default="", help="站点最终地址前缀（如 https://mrf3247.github.io/medhot）；给了就把它开头的绝对 URL 也当成站内资源抓下来")
    a = ap.parse_args()

    base = a.base.rstrip("/")
    prefix = "/" + a.prefix.strip("/")
    pages_url = (a.pages_url or "https://mrf3247.github.io" + prefix).rstrip("/")

    fixed = [r for r in a.routes.split(",") if r]
    queue, seen = list(fixed), set(fixed)
    pages: dict[str, str] = {}
    while queue:
        route = queue.pop(0)
        try:
            body, _, hdrs = get(base + route)
        except Exception as e:
            print(f"  ✗ {route}: {e}")
            continue
        html = body.decode("utf-8", "replace")
        pages[route] = html
        print(f"  ✓ {route} ({len(html)}B)")
        if hdrs.get("content-type", "").startswith("text/html"):
            pool = []
            if route in ("/", "/hot", "/all"):
                pool += [("story", s) for s in re.findall(r'href="(/story/[0-9a-f-]{36})"', html)]
                pool += [("item", s) for s in re.findall(r'href="(/items/[a-z0-9]{16,40})"', html)]
            if route == "/daily":
                pool += [("daily", d) for d in re.findall(r'href="(/daily/[0-9]{4}-[0-9]{2}-[0-9]{2})"', html)]
            for kind, r in pool:
                limit = a.max_stories if kind == "story" else (a.max_items if kind == "item" else a.max_dailies)
                pref = {"story": "/story/", "item": "/items/", "daily": "/daily/"}[kind]
                have = len([x for x in seen if x.startswith(pref)])
                if r not in seen and have < limit:
                    seen.add(r); queue.append(r)

    if not pages:
        print("一个页面都没抓到：检查本地生产 web 是否在跑"); return 1

    assets: dict[str, str] = {}
    def want(u: str) -> str | None:
        u = norm(u)
        if u.startswith("/assets/"):
            return u.lstrip("/")
        if u.startswith("/api/img-proxy"):
            # 用「原图 URL」而不是整条签名 URL 命名：签名每次渲染都会变，按签名命名会导致
            # 每次快照都换一批文件名（页面引用与已下载文件对不上 → 图全裂）。
            src = urllib.parse.parse_qs(urllib.parse.urlsplit(u).query).get("u", [""])[0] or u
            return "avatars/" + hashlib.sha1(src.encode()).hexdigest()[:16] + ext_of(src)
        if u.startswith("/og/") or u in ("/favicon.ico", "/apple-icon.png", "/icon.png", "/icon.svg", "/manifest.webmanifest"):
            return u.lstrip("/")
        return None

    for route, html in pages.items():
        for _, u, _esc in iter_refs(html):
            sp = urllib.parse.urlsplit(u)
            dst = want(sp.path + (("?" + sp.query) if sp.query else ""))
            if dst:
                assets[u] = dst
        # 页面里还有以站点最终地址开头的绝对 URL（og:image、canonical），它们不改写但要落地成文件
        for m in re.finditer(re.escape(pages_url) + r'(/[^"\')\s\\]*)', html):
            p = m.group(1)
            if p.startswith("/assets/") or p.startswith("/og/") or "." in os.path.basename(p):
                d = want(p)
                if d:
                    assets[p] = d
    for u in list(assets):
        if u.endswith(".css"):
            try:
                css = get(base + u)[0].decode("utf-8", "replace")
            except Exception:
                continue
            for _, cu, _e in iter_refs(css):
                d2 = want(cu)
                if d2:
                    assets[cu] = d2

    ok = 0
    for u, dst in assets.items():
        p = os.path.join(a.out, dst)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        try:
            body, _, _ = get(base + u)
            open(p, "wb").write(body)
            ok += 1
        except Exception as e:
            print(f"  ✗ 资源 {u}: {e}")
    print(f"  资源 {ok}/{len(assets)} 下载成功")

    for extra in ("/favicon.ico", "/apple-icon.png", "/manifest.webmanifest"):
        if extra in assets:
            continue
        try:
            body, code, _ = get(base + extra)
            if code == 200 and body:
                p = os.path.join(a.out, extra.lstrip("/"))
                os.makedirs(os.path.dirname(p), exist_ok=True)
                open(p, "wb").write(body)
        except Exception:
            pass

    routes_norm = {r.rstrip("/") for r in pages if r != "/"}
    def rewrite(u: str) -> str:
        u = norm(u)   # 属性里是 &amp;、SSR 载荷里是 \u0026，查表前必须先还原，否则查不到已下载的文件
        sp = urllib.parse.urlsplit(u)
        path, query = sp.path, sp.query
        qs = ("?" + query) if query else ""
        if path.startswith("/api/img-proxy"):
            return prefix + "/" + assets.get(u, want(u) or "avatars/missing.png")
        if path.startswith("/assets/") or path.startswith("/og/") or "." in os.path.basename(path):
            return prefix + path + qs
        if path == "/" or path.rstrip("/") in routes_norm:
            return prefix + ("" if path == "/" else path.rstrip("/")) + "/" + qs
        return prefix + path + qs

    def sub(text: str) -> str:
        return URL_RE.sub(lambda m: m.group(1) + rewrite(m.group(2)) + m.group(3), text)

    for route, html in pages.items():
        p = os.path.join(a.out, route_to_path(route))
        os.makedirs(os.path.dirname(p), exist_ok=True)
        open(p, "w", encoding="utf-8").write(sub(html))
    for u, dst in assets.items():
        if not dst.endswith(".css"):
            continue
        p = os.path.join(a.out, dst)
        try:
            css = open(p, encoding="utf-8").read()
        except Exception:
            continue
        css2 = sub(css)
        if css2 != css:
            open(p, "w", encoding="utf-8").write(css2)

    bad_api = 0
    for route in pages:
        t = open(os.path.join(a.out, route_to_path(route)), encoding="utf-8").read()
        bad_api += len(re.findall(r'"/api/', t))
    # GitHub Pages 默认会跑 Jekyll；放一个 .nojekyll 关掉它（省一次构建，也避免它动我们的文件）
    open(os.path.join(a.out, ".nojekyll"), "w").close()
    json.dump({"pages": sorted(pages), "assets": len(assets), "prefix": prefix, "leftover_api_refs": bad_api},
              open(os.path.join(a.out, "snapshot.json"), "w"), ensure_ascii=False, indent=1)
    print(f"✅ 快照完成：{len(pages)} 页 / {ok} 资源 → {a.out}（残留 /api 引用 {bad_api} 处）")
    return 0

if __name__ == "__main__":
    sys.exit(main())
