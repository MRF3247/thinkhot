// 预印本专页：medRxiv / bioRxiv 单独收，不进全部动态的混排（全部动态只在底部提示条数）。
import { SITE, withSubject } from "@aihot/industry/site";
import { SOURCE_SECTIONS } from "@aihot/industry/taxonomy";
import { Link, useLoaderData, useNavigation, useSearchParams } from "react-router";
import type { Route } from "./+types/preprints";
import type { PoolResponse } from "@aihot/contracts/site";
import { loadOr404, queryString } from "../lib/api.server";
import { listPath, pageMeta } from "../lib/seo";
import { SearchField } from "../features/feed/Filters";
import { DayList, Pagination } from "../features/feed/DayList";
import { EmptyState } from "../components/ui/Page";

const SECTION = SOURCE_SECTIONS[0];

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim().slice(0, 200) || null;
  const tab = url.searchParams.get("tab") === "relevance" ? "relevance" : null;
  const page = Math.min(Math.max(Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1, 1), 50);
  const data = await loadOr404<PoolResponse>(
    `/api/site/pool${queryString({ q, tab, page: page > 1 ? page : null, sourceTag: SECTION.tag })}`,
    { signal: request.signal, busyRedirect: "/preprints/search-busy" },
  );
  return { data };
}

export function meta({ loaderData }: Route.MetaArgs) {
  const q = loaderData?.data.filters.q;
  const page = loaderData?.data.page ?? 1;
  return pageMeta({
    title: q ? `预印本搜索：${q}` : SECTION.label,
    description: `${SITE.name} 单独收录的 medRxiv / bioRxiv 预印本：未经同行评议，仅作线索参考，不进入精选与日报。`,
    path: listPath("/preprints", { q, tab: loaderData?.data.filters.tab === "relevance" ? "relevance" : null, page: page > 1 ? page : null }),
    noindex: !!q,
  });
}

export function headers() {
  return { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=30" };
}

function pageHref(params: URLSearchParams, page: number) {
  const sp = new URLSearchParams(params);
  sp.delete("deep");
  sp.delete("anchorAt");
  sp.delete("search");
  if (page <= 1) sp.delete("page");
  else sp.set("page", String(page));
  const s = sp.toString();
  return s ? `/preprints?${s}` : "/preprints";
}

export default function PreprintsPage() {
  const { data } = useLoaderData<typeof loader>();
  const [params] = useSearchParams();
  const navigation = useNavigation();
  const f = data.filters;
  const busy = navigation.state === "loading" && navigation.location?.pathname === "/preprints";
  const updated = new Date(data.freshness).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Shanghai" });

  return (
    <div className="pb-6">
      <div className="pb-1 pt-5 lg:pt-0">
        <h1 className="text-[24px] font-semibold leading-[1.3] text-ink">{SECTION.label}</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-3">
          {withSubject("动态")}里的预印本单独收在这里：<span className="font-medium">未经同行评议</span>，数据与结论可能被后续版本推翻，只当线索看。
          它们不进入精选、大事榜与日报。
        </p>
      </div>

      <div className="mb-4 mt-4 flex items-center justify-between gap-4">
        <span className="text-[12.5px] text-ink-4">
          今日 <span className="num">{data.todayCount}</span> 条 · 共 <span className="num">{data.total >= 2000 ? "2000+" : data.total}</span> 条 · 更新于 <span className="num">{updated}</span>
        </span>
        <SearchField variant="track" action="/preprints" defaultValue={f.q ?? ""} keep={{}} />
      </div>

      {f.q && (
        <p className="mb-3 text-[12px] text-ink-4">
          搜索“{f.q}”的结果 <span className="num">{data.total >= 2000 ? "2000+" : data.total}</span> 条
        </p>
      )}

      <div className={`transition-opacity duration-200 ${busy ? "opacity-50" : ""}`}>
        {data.items.length === 0 ? (
          <div className="mt-2 lg:card">
            <EmptyState title="没有找到预印本">
              {f.q ? "换个说法，或者去掉搜索再试。" : "这段时间没有收录到预印本。"}
            </EmptyState>
          </div>
        ) : (
          <DayList items={data.items} todayCount={f.q ? null : data.todayCount} showTags />
        )}
      </div>

      <Pagination page={data.page} pageCount={data.pageCount} href={(p) => pageHref(params, p)} />
      <p className="mt-4 text-center text-[12px] text-ink-4">
        要看经同行评议的内容，去 <Link to="/all" className="text-accent hover:underline">全部{withSubject("动态")}</Link> 或{" "}
        <Link to="/" className="text-accent hover:underline">精选</Link>。
      </p>
    </div>
  );
}
