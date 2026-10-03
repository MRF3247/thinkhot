// 信源分区与限流的配置读法：预印本这类「量大但低价值」的源靠它压住自动调度与单次导入量。
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { intervalLockMinutes, maxItemsPerRun, phaseMinutes } from "@aihot/backend/sources/collect";

test("intervalMinutesLock 生效，越界或非数字回落到自动调度", () => {
  assert.equal(intervalLockMinutes({ _aihot: { intervalMinutesLock: 240 } }), 240);
  assert.equal(intervalLockMinutes({ _aihot: { intervalMinutesLock: "180" } }), 180);
  assert.equal(intervalLockMinutes({ _aihot: { intervalMinutesLock: 1 } }), null);
  assert.equal(intervalLockMinutes({ _aihot: { intervalMinutesLock: 99999 } }), null);
  assert.equal(intervalLockMinutes({ _aihot: { intervalMinutesLock: "abc" } }), null);
  assert.equal(intervalLockMinutes({}), null);
  assert.equal(intervalLockMinutes(null), null);
});

test("maxItemsPerRun 只能调小，不能放大全局上限", () => {
  assert.equal(maxItemsPerRun({ _aihot: { maxItemsPerRun: 10 } }, 60), 10);
  assert.equal(maxItemsPerRun({ _aihot: { maxItemsPerRun: 500 } }, 60), 60);
  assert.equal(maxItemsPerRun({ _aihot: { maxItemsPerRun: 0 } }, 60), 60);
  assert.equal(maxItemsPerRun({}, 60), 60);
});

// 到期相位：每条源在自己的间隔里占一个固定位置。没有了这个，整批源会在同一分钟一起到期，
// 于是同一分钟几十个抓取一起出网，直接撞限流（Crossref 429），整个节奏就散了。
test("phaseMinutes 对同一条源稳定，且落在 [0, interval) 内", () => {
  assert.equal(phaseMinutes("rss-aeon", 60), phaseMinutes("rss-aeon", 60));
  assert.notEqual(phaseMinutes("rss-aeon", 60), phaseMinutes("rss-aeon-the-nation", 60));
  for (const id of ["rss-aeon", "thepaper-thought", "arxiv-econ", "cr-mind"]) {
    for (const interval of [15, 60, 120, 360]) {
      const p = phaseMinutes(id, interval);
      assert.ok(Number.isInteger(p) && p >= 0 && p < interval, `${id}@${interval} 得到 ${p}`);
    }
  }
  assert.equal(phaseMinutes("any", 0), 0);
});

test("真实信源清单不会在同一分钟扎堆到期", () => {
  const file = new URL("../industry/sources.json", import.meta.url);
  const { sources } = JSON.parse(readFileSync(file, "utf8")) as { sources: Array<{ id: string }> };
  assert.ok(sources.length > 100, `信源数只有 ${sources.length}`);
  const interval = 60; // 免费源在 adaptIntervals 里被压到 ≤60 分钟
  const buckets = new Map<number, number>();
  for (const s of sources) {
    const b = phaseMinutes(s.id, interval);
    buckets.set(b, (buckets.get(b) ?? 0) + 1);
  }
  const busiest = Math.max(...buckets.values());
  // 均匀散开时每桶约 sources.length / 60 ≈ 2 个；留足冗余，超过 8 个就说明又扎堆了。
  assert.ok(busiest <= 8, `最挤的一分钟有 ${busiest} 条源同时到期（共 ${sources.length} 条）`);
});
