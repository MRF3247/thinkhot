// Recompute the 大事榜 (/hot) right now instead of waiting for the 5-minute worker tick.
// Usage: node --env-file=.env scripts/hot-now.ts
import { computeHotRanking, hotWindowHours } from "@aihot/backend/events/hot";
import { closeDb } from "@aihot/backend/db";

const result = await computeHotRanking();
console.log(JSON.stringify({ ...result, windowHours: hotWindowHours() }));
await closeDb();
