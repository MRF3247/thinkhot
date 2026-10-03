-- 主题分组增加一类 'pitch'（选题池）。
--
-- 站点的「选题榜」用的就是这一组：内容理解那一步会额外判定一条材料能不能做成面向大众的内容，
-- 打上 选题-强 / 选题-中 标签，再由 industry/topics.json 里的 pitch-strong / pitch-pool 两个主题收口。
-- 它和 company / field / genre 是并列的浏览维度，所以单独成组，而不是塞进「内容形态」。
--
-- 向后兼容的增量：只放宽 CHECK，不改动任何已有数据。

ALTER TABLE topics DROP CONSTRAINT topics_grp_check;
ALTER TABLE topics ADD CONSTRAINT topics_grp_check CHECK (grp IN ('company', 'field', 'genre', 'pitch'));
