<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/banner-dark.png">
    <img src="docs/assets/banner-light.png" alt="ThinkHOT —— 人文社科的思想热点：采集 140 个信源，双评分精选与选题榜，每天 08:00 出日报" width="100%">
  </picture>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-176b75?style=flat-square" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/Node.js-24-176b75?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js 24">
  <img src="https://img.shields.io/badge/PostgreSQL-16.2-176b75?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL 16.2">
  <a href="https://mrf3247.github.io/thinkhot/"><img src="https://img.shields.io/badge/%E7%AB%99%E7%82%B9-mrf3247.github.io%2Fthinkhot-202a30?style=flat-square" alt="站点"></a>
</p>

<p align="center">
  <b>一个自己盯全球人文社科信源、自己写日报，还顺带挑出「能做选题」的网站。</b><br>
  顶刊、预印本、智库、思想媒体与中文思想媒体，先筛选再独立评分，选出来的写成中文标题、摘要和推荐理由。
</p>

<p align="center">
  <a href="#跑起来">跑起来</a> ·
  <a href="#信源140-个逐个实测过">信源</a> ·
  <a href="#它是怎么工作的">它是怎么工作的</a> ·
  <a href="#两个榜学术榜与选题榜">两个榜</a> ·
  <a href="#评分为何偏低以及怎么修的">评分校准</a> ·
  <a href="#发布到公网">发布到公网</a>
</p>

<br>

## 这是什么

ThinkHOT 是 [AIHOT](https://github.com/KKKKhazix/AIHOT)（MIT）开源框架的**人文社科版**，与医学版 [MedHOT](https://github.com/MRF3247/medhot) 同源。同一套流水线：

> 采集 → 机械判重 → 模型预筛 → **同一份标准独立打两次分** → 过门槛进精选 → 写中文标题 / 摘要 / 推荐理由 / 标签 → 把不同来源说的同一件事聚成一个事件 → 排榜 → 每天早上 08:00 出日报

站名 ThinkHOT，行业词是「思想」（页面上就是「思想日报」「全部思想动态」）。信源、分类、评分标准（提示词原文）和门槛全部在仓库里，改标准不用改代码。

- 线上读的是静态快照：<https://mrf3247.github.io/thinkhot/>
- 本地跑起来是：<http://localhost:3020>　后台 `/admin`（与 MedHOT 的 3000 / 3001 / 5433 错开，两个站可以同时跑）

## 为什么不做成「按学科分的学术聚合」

按学科分类（哲学一栏、社会学一栏）读起来像文献库，不像一份值得每天看的站点。这里的分类是**思想主题**，学科降级成标签，两边都能筛：

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

日报分 6 节：思想前沿 / 社会与制度 / 文化与历史 / 伦理与技术 / 知识与方法 / 长文与论争。

## 说在前面

- **这是个行业版改造，不是通用框架。** 改造面几乎全在 `industry/` 一个文件夹，`apps/` 与 `packages/` 只动了四处行业文案加一处导航。
- **门槛做过一轮校准，但评分本身还没修好。** T2（思想媒体）门槛已按实测从 72 降到 62，细节见[评分为何偏低](#评分为何偏低以及怎么修的)；但**评分模型并不真做五轴加权计算**，它给的是直觉分，所以分数被量化在少数几个值上——这是下一步的架构级改动。
- **中文源已接 7 个**，全部是网页可直接抓的；公众号类（文化纵横、读书等）需要付费 key，暂未接。
- **不要用 AIHOT 的名字和 Logo。** 本项目与 AIHOT 是改造关系，站名、图标、配色都是自己的。

## 它是怎么工作的

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/how-dark.png">
  <img src="docs/assets/how-light.png" alt="六步：采集、预筛、两次评分、写作、聚簇、上榜与成刊" width="100%">
</picture>

一条资料从信源进来，先按标题和链接机械判重，再预筛；可能重要的由同一份评分标准**独立打两次分**，两次之和 ≥ 2 × 门槛才进精选；然后写中文标题、答案先行的摘要、推荐理由和标签；不同来源说的同一件事聚成一个事件；最后进日报。提示词都在 [`industry/prompts/`](industry/prompts/)：

- `prefilter.md` —— 人文社科相关性预筛；划了跨学科红线（纯临床 / 药学成果不属于本站，除非同时谈人的行为、社会或伦理）
- `selection-score.md` —— **核心**：五轴（实质份量 / 信息增量 / **论证与证据质量** / 共振面 / 可用性）× 8 种内容类型的权重表 + 社科版「必须正常评价 / 必须压住的噪声」+ 事件口径校正（专治「把相关当因果」「把大学生样本当人类普遍规律」）
- `content-understanding.md` —— 内容类型、社科标签白名单、推荐理由禁用词，以及**选题性判定**
- `rules-domain.md` —— 社科翻译规则：significance 是「统计显著」不是「重大」；correlation 不是因果；sex ≠ gender；convenience sample 要写明；学者名有通行译名用中文，否则保留英文
- `rules-self-contained-title.md` —— 动作词硬边界：associated with ≠ 导致，preprint ≠ 已发表，大学生样本 ≠ 人类普遍

### 聚簇与大事榜

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/cluster-dark.png">
  <img src="docs/assets/cluster-light.png" alt="五个来源的报道聚成一个事件，事件进入大事榜" width="100%">
</picture>

同一件事，智库发一次报告、几家媒体各写一篇，读者只需要看到一次。聚簇先用标题摘要的向量在最近两周里找候选，再让模型判断是同一件事、后续进展，还是两件事。

**大事榜**（`/hot`）排的不是讨论人数，而是**重要度**：取窗口内每个事件所有公开报道里最高的精选评分，同分按时间新近兜底；热度降级成卡片上的徽章，只作上下文。窗口默认 **48 小时**（社科选题节奏比医学快）。

> 为什么不是「热度榜」：上游规则要求「≥2 家独立来源 + 至少 1 家编辑部性质源」，而思想类信源几乎都是独家——586 个事件里只有 3 个有第二家独立来源，于是长期空榜。这是规则跟信源结构不匹配，不是故障。

## 两个榜：学术榜与选题榜

| | 学术榜（默认） | 选题榜 |
|---|---|---|
| 页面 | `/`、`/all`、`/hot`、日报 | `/topics/pitch-strong`（强选题）、`/topics/pitch-pool`（全部可选题） |
| 怎么来的 | 两次独立评分 ≥ 2 × 门槛 | 写稿那一步额外判定「能不能做成一条面向大众的内容」，打上 `选题-强` / `选题-中` 标签 |
| 成本 | — | **零额外模型调用**（搭在本来就要调的 content-understanding 那一步上） |

选题的四条判据：① 能讲给外行听 ② 有反直觉或冲突 ③ 有具体的人和场景 ④ 能接上当前公共讨论。中三条 → `选题-强`；中两条 → `选题-中`。提示词里明确要求**稀缺**：大多数严肃研究不该带这两个标签。

排序目前仍是按时间倒序，没有按「可选题性」数值排（那需要加字段和第二套评分，见「已知限制」）。

## 你会得到什么

| | |
|---|---|
| **信源** | 140 个源，逐个实测过可用（见下）；三档分级（T1 研究机构与学会 / T1_5 预印本与准官方 / T2 媒体与个人），抓取间隔按产出自动调整 |
| **精选** | 预筛 + 同一标准独立打两次分 + 按分级门槛入选；提示词与门槛全部在仓库里，可用自己标注的样本在 SelectBench 里校准 |
| **写作** | 中文标题、答案先行的摘要、推荐理由、标签；社科翻译规则写死在提示词里（见上） |
| **聚簇** | 同一件事的报道归成一个事件，事件页有综述；人工改过的归属不会被覆盖 |
| **大事榜** | 按事件重要度排（窗口内最高精选评分，48 小时窗口），热度作徽章 |
| **选题榜** | 自动挑出「能做成面向大众内容」的稿子，四条判据、零额外调用 |
| **日报、周报、月报** | 每天 08:00 出日报，每周一出周报，每月 1 日出月报，分 6 节、带导语 |
| **主题与搜索** | 42 个主题页：机构与期刊 9、学科与方向 21、内容形态 10、选题池 2；另有标题摘要搜索与全文相关搜索 |
| **预印本分区** | `/preprints` 独立成页，不精选、不上大事榜、不进日报 |
| **给 Agent 用** | RSS（精选 / 全部 / 全文 / 日报）、公开 API、MCP（工具名前缀 `thinkhot_`）、`llms.txt` |
| **后台** | 信源管理与试抓、内容诊断、精选评测（SelectBench）、每一步单独换模型、付费服务的预算熔断、运行记录与告警 |
| **AI 行业专属模块** | 模型榜、Codex 重置监控 —— 本项目两个开关都已关掉（`industry/features.ts`），导航里不再出现入口，相关任务不再运行 |

## 看一眼

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/shots-dark.png">
  <img src="docs/assets/shots-light.png" alt="首页的大事榜与精选，关于页的信源河" width="100%">
</picture>

## 跑起来

### 本机（当前的部署方式）

本机没有 Docker / Homebrew，是 PostgreSQL 16.2（`/Users/Jin/pgsql/16/bin`）+ Node 26.8.1 直接跑：

```bash
cd /path/to/ThinkHOT
./thinkhot.sh start          # 起 postgres + api + worker + web
./thinkhot.sh status         # 进程 / 已入库 / 精选条数
./thinkhot.sh logs worker 80 # 看某个进程日志
./thinkhot.sh stop           # 停三个进程（postgres 保持运行）
```

- 网站 `3020` · API `3021` · PostgreSQL `5434`（库名 `thinkhot`）· 后台 `/admin`
- 后台密码在 `.env` 的 `ADMIN_PASSWORD`。**`.env` 含密钥，不进 Git**
- 冒烟测试的两个安全阀：`COLLECT_ENABLED=false` 不抓取、`MODEL_CALLS_ENABLED=false` 只采集不调模型（零成本跑通采集链路）；改完 `.env` 必须重启，进程只在启动时读

### 用 Docker（上游方式）

```bash
git clone https://github.com/MRF3247/thinkhot.git thinkhot
cd thinkhot
node scripts/init-env.ts --llm-key <你的模型 API Key>   # DeepSeek、千问、智谱等 OpenAI 兼容接口都行
docker compose up -d --build
```

## 信源：140 个，逐个实测过

**这些源不是照抄清单写的，是每个都发过请求验证过的**（能用才写进 [`industry/sources.json`](industry/sources.json)）。

| 组 | 怎么抓 | 覆盖 |
|---|---|---|
| 人文社科顶刊（约 70 个源） | Crossref API，按 ISSN 取最新论文与摘要 | 哲学、社会学、心理学、人类学、政治学、经济学、历史学、文学理论、语言学、教育学、传播学 |
| 预印本平台 | OSF API | PsyArXiv、SocArXiv、EdArXiv、MetaArXiv、AfricArXiv、LawArXiv 等 |
| arXiv 分类 | arXiv Atom | 科学哲学与物理史、经济学、计算与社会、社会与信息网络 |
| 智库与数据 | RSS | NBER、Pew Research、Our World in Data、RAND、Bruegel、Crisis Group、CSER、Santa Fe 等 |
| 思想媒体与长文 | RSS | Aeon、Noema、The Point、Crooked Timber、3 Quarks Daily、The Atlantic·Ideas、LRB、Quanta、Works in Progress、Paris Review、New Atlantis、The Nation、Guardian Long Read、JSTOR Daily 等 |
| 哲学专线 | RSS | Daily Nous、Notre Dame Philosophical Reviews、The Philosopher、Philosophy Now、3:AM、Brains、The Splintered Mind、Blog of the APA，以及 Ergo、Philosophers' Imprint、Australasian Journal of Philosophy、JAPA 等 |
| 学术生态与新闻 | RSS | APS、Inside Higher Ed、Social Science Space、Retraction Watch、PsyPost、Futurity |
| **中文思想媒体** | `web_list` 抓列表页 + RSS | 澎湃思想市场、澎湃上海书评、爱思想、知识分子、中国社会科学网·中国哲学、经济观察报·书评、经济观察报·观察家 |

按标签统计（一个源可带多个标签）：期刊 71 · 思想媒体 34 · 哲学 25 · 心理学 14 · 社会学 10 · 经济学 10 · 预印本 10 · 智库 7 · 学术机构 7……
按抓取方式：JSON 接口 76 个 · RSS 59 个 · 网页列表 5 个。

**实测抓不到、因此没纳入的**：Brookings、SSRC、Urban Institute、ASA、APA、Marginal Revolution、Cato、Annual Reviews、Cambridge、Sage、Wiley（403 / TLS 被重置）；Dissent、Jacobin、Heritage（连接被重置）；Journal of Political Philosophy、Diacritics（Crossref 两种 ISSN 都取不到）。这几家是**本机网络**不通，换机部署时值得重测。

**中文源抓法（实测可用，别再假设抓不到）**：

- 澎湃是 Next.js 服务端渲染，条目就在 HTML 里 —— `parseMode: "html"` + `itemSelector: "div.ant-card"` + `titleSelector: "h2"`
- 澎湃列表页日期是相对时间（「8小时前」），宽松日期解析不认 → 必须配 `detail.publishedAtRegex` 去详情页抠 `"pubTime"`
- 澎湃卡片里的评论链接带 `?commTag=true`，选择器要写 `:not([href*="?"])` 排掉，否则会多出一批带 query 的重复条目
- 判断一个站能不能抓，唯一可信的方法是**抓下 HTML 用 cheerio 跑一遍选择器数条目**，不是看它像不像 SPA

## 评分为何偏低，以及怎么修的

首轮实测：中文源平均 22 分、哲学源平均 27.7 分（160 篇只有 5 篇入选），英文期刊与媒体源平均 40+。两层病因，**都不是「门槛太高」那么简单**：

1. **`cred` 轴的定义把「纯思辨」列在低分端** —— 任何纯理论工作在证据强度上被判死，而理论论证类文章的 `cred` 权重是 2，直接封顶。修法：`cred` 按内容类型分两种读法（经验类看证据形态 / 论证类看论证质量：推理链、概念澄清、有没有回应最强反驳），并明确「不得因没有数据压低理论工作的分数」，同时**不许反向放水**（术语堆砌仍要给低分）。
2. **来源分级门槛与模型偏好叠加** —— 模型对媒体稿系统性给低约 10 分（期刊条目读起来像「研究公告」，媒体长文不是），于是「媒体门槛更高」的设计把思想媒体整片砍掉：T2（538 篇）里只有 7 篇过 72 分（1.3%），而配置本意是「思想媒体正是本站的主要产出」。故把 **T2 从 72 对齐到 62**。

用 1591 条真实稿件做前后对比（`scripts/eval-selection.ts`）：思想媒体入选 6 → 61 条，总量 445 → 510，哲学源 23 → 27，T1 / T1_5 未动。门槛只影响入选判定，分数不变。

现行门槛（[`industry/selection.ts`](industry/selection.ts)）：**T1 58 / T1_5 62 / T2 62**，`understandFloor` 48。

## 发布到公网

**静态快照 + 定时推 GitHub Pages**（当前方案，免费、不需要域名）：

```bash
./snapshot.sh          # 抓本机站点的只读快照 → 强推 gh-pages 分支
```

- 地址固定：<https://mrf3247.github.io/thinkhot/>　·　launchd 任务 `com.thinkhot.snapshot` 每天 9:00 / 12:00 / 15:00 自动跑
- 日志在 `.publish/snapshot.log`；改过前端不用手动构建，快照脚本发现 build 不存在会自己重建
- 代价：**不是实时**，内容跟着快照时间走

> 曾经用过 Cloudflare 快速隧道（`publish.sh`）做实时站点，实测不可用：地址每次重启都换、旧地址会永久失效。**不要把它当长期链接发出去。**

## 文档

| 文档 | 内容 |
|---|---|
| [ThinkHOT-本地运行说明.md](ThinkHOT-本地运行说明.md) | **本项目实际怎么跑**：启停、端口、运行环境、分类体系、两个榜、相对 MedHOT 改了什么、信源与实测记录、自测、已知限制 |
| [把它改成你的行业](docs/customize.md) | 站名、分类、信源、提示词、门槛、品牌，一步一步来（上游文档，仍然适用） |
| [信源](docs/sources.md) | 六种信源怎么配，分级与全文，外部推送接口 |
| [精选与校准](docs/selection.md) | 一条资料怎么变成精选，怎么用自己的样本校准 |
| [部署](docs/deploy.md) | Docker、域名与 HTTPS、中国大陆、更新、备份、花多少钱 |
| [架构](docs/architecture.md) | 三个进程、几条不变的规则、目录、对外出口 |

技术栈：Node.js · TypeScript · React Router（服务端渲染）· Fastify · PostgreSQL · pg-boss · Tailwind CSS · Docker Compose（可选）。

## 已知限制与下一步

1. **评分模型不做五轴加权计算。** 提示词要求「在心里算五轴再加权、只输出一个分数」，结果模型直接给直觉分（实测 `completion_tokens: 7`），分数被量化在少数几个值上（62 占 18%、22 占 14%），源的最高分常常正好是 62.00。所以校准只能按实测分布做，不能按提示词推导；真正的修法是让模型输出五轴、加权在代码里算 —— 属评分契约改动，需单独立项。
2. **选题榜没有可选题性排序**（现在按时间倒序）。要做需要加 `topic_score` 字段 + 第二套独立评分，每条多 2 次模型调用。
3. **事件归组只有词面与规则线索**，没配向量模型（`EMBEDDING_*` / `DASHSCOPE_API_KEY`），跨语言同一件事可能归不到一起。
4. **中文源可再扩**：公众号类（文化纵横、读书、罗辑思维）需要「极致了」付费 key。
5. **首次导入的存量条目按原文时间归档**，不进当天 —— 所以建站当天的日报是空的，这是框架「旧文不刷屏」的规则，不是故障。

## 许可

代码使用 [MIT 许可证](LICENSE)，源自 [AIHOT](https://github.com/KKKKhazix/AIHOT)（MIT）。AIHOT 的名字和 Logo 不在本项目许可范围内。

---

<sub>**In English:** ThinkHOT is a humanities-and-social-science "ideas" vertical built on the open-source AIHOT framework (MIT), a sibling of the medical edition MedHOT. It tracks 140 sources — top journals via Crossref (by ISSN, with abstracts), OSF and arXiv preprints, think tanks and survey data, long-form essay outlets, philosophy blogs and networks, and seven Chinese-language outlets — deduplicates, pre-filters, scores every item twice with the same rubric, writes Chinese headlines and summaries, clusters reports of the same story into one event, ranks a "big news" board by the highest selection score of the event rather than by how many sources discuss it, and additionally tags items that could be turned into a general-audience story ("pitch board", at zero extra model cost). A daily briefing is published at 08:00 Beijing time. All prompts and thresholds live in `industry/`. The documentation is in Chinese.</sub>
