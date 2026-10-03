// 一次性脚本：把“最新一条分析仍是旧提示词版本”的编辑类稿件重新入队。
// 改了 prompts/selection-score.md 之后，已有的分析不会自动失效，必须显式重跑；
// 先跑 enqueue-analysis.ts --all，再用这个脚本把漏掉的补齐（singletonKey 换后缀以绕过去重）。
import { closeDb, sql } from "@aihot/backend/db";
import { enqueue, QUEUES, stopBoss } from "@aihot/backend/jobs/queue";
import { promptVersion } from "@aihot/backend/editorial/prompts";

const scoreVersion = promptVersion("selection-score");
const rows = await sql<{ id: string }[]>`
  SELECT a.id
  FROM articles a JOIN sources s ON s.id = a.source_id
  WHERE s.participation_mode = 'editorial'
    AND NOT EXISTS (
      SELECT 1 FROM analyses an
      WHERE an.article_id = a.id AND an.origin = 'model'
        AND an.prompt_version LIKE ${"%" + scoreVersion + "%"}
    )
  ORDER BY a.discovered_at DESC`;

for (const r of rows) await enqueue(QUEUES.analyze, { articleId: r.id }, { singletonKey: `${r.id}:rescore` });
console.log(`enqueued ${rows.length}（目标评分版本 ${scoreVersion}）`);

await stopBoss();
await closeDb();
