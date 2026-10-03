# ThinkHOT — 人文社科思想热点站

用 [AIHOT](https://github.com/KKKKhazix/AIHOT)（MIT）的开源框架改成人文社科（思想）行业的版本：
自动盯住全球社科信源 → 机械判重 → 模型预筛 → **同一份标准独立打两次分** → 过门槛进精选 → 写中文标题/摘要/推荐理由/标签 → **把同一件事的多篇报道归成一个事件** → 按独立来源算热度 → 每天早上 08:00 出日报。

站名 ThinkHOT，行业词「思想」（页面上就是「思想日报」「全部思想动态」）。

## 在哪

| 位置 | 内容 |
|---|---|
| `/Users/Jin/Documents/GitProgram/AIHOT` | 原项目快照（未改动，留着对照） |
| `/Users/Jin/Documents/GitProgram/MedHOT` | 医学版（期刊 / 预印本 / 药监机构 / 药企） |
| `/Users/Jin/Documents/GitProgram/ThinkHOT` | **人文社科版（本项目）** |

## 启停

```bash
cd /Users/Jin/Documents/GitProgram/ThinkHOT
./thinkhot.sh start      # 启动 postgres + api + worker + web
./thinkhot.sh status     # 看进程 / 已入库 / 精选条数
./thinkhot.sh logs worker 80   # 看某个进程日志
./thinkhot.sh stop       # 停三个进程（postgres 保持运行）
```

- 网站：<http://localhost:3020>　后台：<http://localhost:3020/admin>
- 后台密码在 `.env` 的 `ADMIN_PASSWORD`（`.env` 不进 Git）
- 端口：**3020** 网站 · **3021** API · **5434** PostgreSQL（与 MedHOT 的 3000/3001/5433 错开，两个站可以同时跑）
- `thinkhot.sh` 的兜底清理只杀本项目的进程（用绝对路径匹配），不会误伤 MedHOT

## 运行环境（本机已装好）

- **PostgreSQL 16.2**：`/Users/Jin/pgsql/16/bin`（数据目录 `ThinkHOT/.pgdata`，只监听 127.0.0.1:5434）
  本机没有 Homebrew/Docker，这套 16.2 是从 `pgserver` 的预编译包里拆出来的（二进制要求 `.dylibs` 在 `bin` 的上两级，所以路径必须是 `/Users/Jin/pgsql/16` + `/Users/Jin/pgsql/.dylibs`，**不能带空格**）。
  `pg_trgm` 扩展已经装在这套 PG 的共享目录里，新建实例直接可用。
- **Node 26.8.1**：`/Users/Jin/.hermes/node/bin/node`
- **模型**：DeepSeek `deepseek-flash`（`.env` 的 `LLM_*`，key 取自 `~/.hermes/.env`）

## 分类体系：按「思想主题」分，不按学科分

| 分类（网址用） | 收什么 | 挂哪些学科 |
|---|---|---|
| 心智与意识 `mind` | 认知、情绪、意识、精神健康、脑与行为 | 心理学、认知科学、心智哲学 |
| 社会与制度 `society` | 组织、阶层、治理、公共政策、法律、城市与家庭 | 社会学、政治学、法学 |
| 经济与市场 `economy` | 行为经济、劳动、不平等、全球化 | 经济学 |
| 教育与成长 `education` | 学习科学、教育政策、大学与学术职业 | 教育学 |
| 身份与文化 `culture` | 族群、性别、宗教、仪式、亚文化、移民 | 人类学、文化研究 |
| 历史与记忆 `history` | 史学研究、历史社会学、记忆与纪念 | 历史学 |
| 技术与未来 `tech` | 技术的社会影响、AI 治理、数字生活、气候与环境 | 技术哲学、STS |
| 伦理与价值 `ethics` | 道德哲学、政治哲学、应用伦理 | 哲学 |
| 知识与科学 `knowledge` | 认识论、方法论、复现与学术诚信、出版与经费 | 科学哲学、元研究 |
| 语言与意义 `language` | 语义语用、翻译、修辞、文学理论 | 语言学、文学理论 |
| 公共讨论 `essays` | 长文、评论、访谈、书评、论争 | 跨学科（思想媒体主场） |

- 学科信息放在**标签**里（哲学、社会学、心理学……），筛选栏和主题页两边都能筛。
- 日报分 6 节：思想前沿 / 社会与制度 / 文化与历史 / 伦理与技术 / 知识与方法 / 长文与论争。

## 两个榜

| | 学术榜（默认） | 选题榜 |
|---|---|---|
| 页面 | `/`、`/all`、`/hot`、日报 | `/topic/pitch-strong`（强选题）、`/topic/pitch-pool`（全部可选题），导航「选题榜」入口指向前者 |
| 怎么来的 | 两次独立评分 ≥ 2 × 门槛 | 写稿那一步额外判定「能不能做成一条面向大众的内容」，打上 `选题-强` / `选题-中` 标签 |
| 成本 | — | **零额外模型调用**（搭在本来就要调的 content-understanding 那一步上） |

选题的四条判据：① 能讲给外行听 ② 有反直觉或冲突 ③ 有具体的人和场景 ④ 能接上当前公共讨论。
四条中三条 → `选题-强`；中两条 → `选题-中`。提示词里明确要求**稀缺**：大多数严肃研究不该带这两个标签。

排序仍是按时间倒序（没有按"可选题性"数值排——那需要加数据库字段和第二套评分，见下面「下一步」）。

## 相对 MedHOT 改了什么

改造面几乎全在 `industry/` 一个文件夹，`apps/` 与 `packages/` 只动了四处文案 + 一处导航：

| 文件 | 改动 |
|---|---|
| `industry/site.ts` | 站名 **ThinkHOT**、行业词「思想」、关于页文案、版权与下架说明、主题色域 |
| `industry/taxonomy.ts` | 11 个思想主题分类；8 种内容类型（实证研究/理论论证/综述/长文/公共讨论/政策报告/学术体制/解读教学）；28 个分类标签 + 32 个主题与形态标签 + 28 个实体标签；主体名录（NBER、Pew、Brookings、各学会、顶刊）；**身份词典专门处理缩写歧义**（APA = 美国心理学会 or 美国哲学会） |
| `industry/topics.json` | 42 个主题页，四组：机构与期刊 9、学科与方向 21、内容形态 10、**选题池 2** |
| `industry/sources.json` | **129 个信源**（见下「信源」一节），逐个实测过可用 |
| `industry/prompts/prefilter.md` | 人文社科相关性预筛；划了跨学科红线（纯临床/药学成果不属于本站，除非同时谈人的行为/社会/伦理） |
| `industry/prompts/selection-score.md` | **核心**：五轴（实质份量/信息增量/**论证与证据质量**/共振面/可用性）× 8 种内容类型权重表 + 社科版「必须正常评价」与「必须压住的噪声」+ 事件口径校正（专治「把相关当因果」「把大学生样本当人类普遍规律」） |
| `industry/prompts/content-understanding.md` | 8 类内容类型、社科标签白名单、推荐理由禁用词、**选题性判定** |
| `industry/prompts/rules-domain.md` | 社科翻译规则：significance 是「统计显著」不是「重大」、correlation 不是因果、sex ≠ gender、convenience sample 要写明；学者名有通行译名用中文，否则保留英文 |
| `industry/prompts/rules-self-contained-title.md` | 动作词硬边界：associated with ≠ 导致，preprint ≠ 发表，大学生样本 ≠ 人类普遍 |
| `industry/prompts/structure.md` | 事实抽取：subject 必须是原文里的机构/学者/研究/政策名；action 要区分发表/预印本上线/政策生效/判决/撤稿 |
| `industry/selection.ts` | 门槛 T1 58 / T1_5 62 / T2 72，understandFloor 48 |
| `industry/brand/` | 新图标（琥珀色四角星 + 深紫底，与 MedHOT 同族的家族感）、报头字重新生成为「思想日报/周报/月报」 |
| `industry/pages/` | 使用规则与隐私说明（运营主体、联系方式等**待填写**） |
| `apps/web/.../nav.ts` | 侧边栏加「选题榜」入口，指向 `/topics/pitch-strong`（主题页真实路径是 `/topics/:slug` 复数，`MORE_PATHS` 里已有的 `/topics` 已覆盖） |
| `apps/web` 四处文案 | topics 页、hot 页、日报 format 注释里的「医学」字样 |
| `tests/` | 示例行业换成社科版（分类 key `research`→`mind`、itemType `trial_result`→`empirical_study`、标签、门槛 60→58、floor 50→48） |

## 信源：129 个，逐个实测过

**这些源不是照抄清单写下来的，是每个都发过请求验证过的**（能用才写进 `industry/sources.json`）。

| 组 | 数量 | 怎么抓 | 分级 | 覆盖 |
|---|---|---|---|---|
| 人文社科顶刊 | **67** | Crossref API（按 ISSN 取最新论文，带摘要） | T1 | 哲学 9、社会学 7、心理学 8、人类学 5、政治学 6、经济学 8、历史学 5、文学理论 4、语言学 5、教育学 5、传播学 5 |
| 预印本平台 | **6** | OSF API | T1_5 | PsyArXiv、SocArXiv、EdArXiv、MetaArXiv、AfricArXiv、LawArXiv |
| arXiv 分类 | **4** | arXiv Atom | T1_5 | 科学哲学与物理史、经济学、计算与社会、社会与信息网络 |
| 智库与数据 | **7** | RSS | T1 | NBER、Pew Research、Pew 事实库、RAND、Our World in Data、Niskanen、Russell Sage |
| 思想媒体 | **13** | RSS | T2 | Aeon、Psyche、Noema、LRB、Quanta、Nautilus、The Point、Crooked Timber、3 Quarks Daily、The Atlantic·Ideas、Persuasion、Behavioral Scientist、SAPIENS |
| 学会与学术生态 | **3** | RSS | T1/T2 | 心理科学协会（APS）、Inside Higher Ed、Social Science Space |
| **中文思想媒体** | **7** | `web_list` 抓列表页 + RSS | T1/T2 | 澎湃思想市场、澎湃上海书评、爱思想、知识分子、中国社会科学网·中国哲学、经济观察报·书评、经济观察报·观察家 |
| 思想媒体与长文（增补） | **12** | RSS | T2 | Works in Progress、Paris Review、New Atlantis、American Affairs、Liberties、The Nation、The Conversation、Guardian Long Read、The Drift、Undark、JSTOR Daily、Science News |
| 学术生态与新闻（增补） | **4** | RSS | T1/T2 | Blog of the APA、Retraction Watch、PsyPost、Futurity |
| 智库与研究机构（增补） | **4** | RSS | T1 | Bruegel、International Crisis Group、剑桥存在性风险研究中心（CSER）、Santa Fe Institute |
| Nature 学科动态（增补） | **2** | RSS | T1 | Nature 社会科学、Nature 心理学 |

**实测没通过、因此没写进去的**（想加要另想办法）：

| 源 | 情况 |
|---|---|
| Brookings、SSRC、Urban Institute、ASA、APA、Marginal Revolution、Times Higher Ed | 对服务器请求返回 403 / Cloudflare 拦截 |
| Synthese、World Politics、New Literary History | 印本 ISSN 在 Crossref 取不到，换 e-ISSN 后可用（已按 e-ISSN 写入）|
| Journal of Political Philosophy、Diacritics | 两种 ISSN 都取不到，未纳入 |

**2026-10-03 实跑结果**（分两轮：先 100 个源，再补跑新增的 29 个）：

- 第一轮：100 个源里 **99 个抓取成功**（1 个 Crossref 429 限流，下轮自愈）。
- 第二轮：新增 29 个源里 **27 个抓到条目**；Guardian Long Read 一个源 `fetch failed`（探测时是通的，属偶发）；Santa Fe、The Drift 各找到 2 条但 0 条入库（条目少，且与已入库内容判重了）。
- 累计：入库 **672 条** → 进流程 249 条 → 评分 249 条 → **入选 69 条**；其中中文源入库 30 条、进流程 8 条。

**中文源的现状（要校准）**：8 条中文稿平均分 **22 分**（最高 34），按 T2 门槛 72 算**一条都没过**。
同期英文源平均 42 分、最高 84 分，英文源里也有 84 条在同分数段。所以这不是"中文被抓漏了"，
更可能是评分标准偏向了「有实证与数据」的论文：澎湃系多是书评与文化评论，在 `信息增量/证据强度` 两轴上天然吃亏。
**这是下一步调门槛时最该先看的一块**——否则中文思想媒体等于白接。

已知取舍：
- **Crossref 没有 authorString**，作者只能取到第一作者的姓（`author.0.family`），或留空。
- 摘要来自 Crossref 的 `abstract`（JATS 格式，会被剥标签），**不是每篇都有**（实测 Mind 是 8 篇里 6 篇有），没摘要的条目模型只能按标题写。
- 期刊源的抓取间隔设的是 360 分钟；框架会在每天 04:20 按近 7 天产出自动调整。

## 抓取上踩过的坑

- **澎湃是 Next.js 服务端渲染，条目就在 HTML 里**，`parseMode: "html"` + `div.ant-card` 就能抓（实测 20 / 19 条）。
  但它列表页的日期是相对时间（"8小时前"），`parseLooseDate` 不认 → 必须配 `detail.publishedAtRegex` 去详情页抠 `"pubTime"`。
- 澎湃卡片里的评论链接带 `?commTag=true`，选择器要用 `:not([href*="?"])` 排掉，否则会多出一批带 query 的重复条目。
- **Marginal Revolution 用 `/feed`（不带斜杠），带斜杠返回 403**；The Nation 必须带 `?post_type=article`；Paris Review 用 `/blog/feed/` 而不是 `/feed/`。
- 本机直连不通、所以没接的：Sage 全站（TLS 被重置）、Wiley、Cambridge、Annual Reviews、Cato（403），Dissent / Jacobin / Heritage（ECONNRESET）。
  这几家在别的网络环境可能是通的，换机部署时值得重测。

## 门槛没校准（最大的待办）

`selection.ts` 里那组数是 **AIHOT 在 AI 领域校准的**，不是社科领域校准的结果，现在只是起点。
T2 门槛特意没有沿用 AIHOT 的 76：思想媒体（Aeon、Noema、Boston Review）正是本站的主要产出，门槛过高会整片砍掉，所以先压在 72。

校准办法：从现有稿件里挑 100–200 条人工标「该选/不该选」（格式见 `industry/gold.example.jsonl`），然后

```bash
node --env-file=.env scripts/eval-selection.ts --gold .data/gold.jsonl --label "社科第一版"
```

看准确率与不同门槛下的表现，再回改 `prompts/selection-score.md`（先改标准，再动门槛）。

## 自测（改过行业包后跑一遍）

```bash
cd /Users/Jin/Documents/GitProgram/ThinkHOT
PGBIN=/Users/Jin/pgsql/16/bin
$PGBIN/dropdb -h 127.0.0.1 -p 5434 -U postgres thinkhot_test; $PGBIN/createdb -h 127.0.0.1 -p 5434 -U postgres thinkhot_test
DATABASE_URL="postgres://postgres@127.0.0.1:5434/thinkhot_test" node scripts/migrate.ts
DATABASE_URL="postgres://postgres@127.0.0.1:5434/thinkhot_test" npm test    # 138 项，约 26 秒
npm run typecheck
node scripts/smoke.ts --base http://localhost:3020    # 站点跑起来以后
```

## 花钱

- 每条新资料：预筛 1 次 + 评分 2 次 + 写作与结构化 1–2 次；首次导入约 129 个源（每源回补 5 条）≈ 650 条 ≈ 4000 次调用，DeepSeek flash 很便宜。
- 后台「设置 → 预算」能设每分钟/小时/天的调用上限，超了自动暂停。
- 回补条数在后台「信源」里调（`initialBackfillLimit`）。
- 选题榜不额外花钱。

## 已知限制

- 事件归组目前只有词面/规则线索（没配向量模型），同一件事的跨语言报道可能归不到一起。想加强可配 `EMBEDDING_*`（或 `DASHSCOPE_API_KEY`）多一路向量召回。
- 网页是开发模式跑的（`react-router dev`）；要长期当服务用，可以改成 `npm run build -w @aihot/web` + `node apps/web/server.ts`。
- 首次导入的条目按 AIHOT 的规则「发布超过 48 小时的按原文时间归档、不进今天」，所以首页只显示最近两天精选。
- 选题榜目前按时间倒序，没有按「可选题性」数值排序（那是「乙方案」：加 `topic_score` 字段 + 第二套独立评分，每条多 2 次模型调用）。
- 中文源已接 7 个（澎湃思想市场 / 上海书评 / 爱思想 / 知识分子 / 中国社会科学网 / 经济观察报书评与观察家），**都是网页可直接抓的**。
  公众号类（文化纵横、读书、罗辑思维）仍没接：需要「极致了」付费 key（按次计费）。
- 首次导入的存量条目按原文时间归档（不进当天日报、不推送），所以**建站当天日报是空的**，内容会从之后新发现的条目开始累积——这是框架的「旧文不刷屏」规则，不是故障。
