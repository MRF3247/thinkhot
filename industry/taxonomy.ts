// 这个行业的分类体系：类别、标签词表、机构与期刊名录，以及防止张冠李戴的身份词典。
// 模型按这里的词表打标签，主题页（topics.json）按标签归类，筛选栏按类别分组。
// 换行业时：类别的 key 会出现在网址里（/all?category=…），上线后就不要再改；标签和名录可以随时增减。

/**
 * 网页上的类别（筛选栏、卡片角标、RSS 分类订阅）。key 是网址和接口里的身份，上线后不要改。
 * section 是日报里的分节标题（几个类别可以共用一节，按这里的顺序排）；guide 告诉模型怎么归类。
 * 没归上类的资料在日报里放进第一个 key 为 society 的类别所在的节。
 *
 * 这里按「思想主题」分，不按学科分：找选题时按主题逛比按学科逛顺手，学科信息放在标签里（TOPIC_TAGS）。
 */
export const CATEGORIES = [
  { key: "mind", label: "心智与意识", section: "思想前沿", guide: "认知、情绪、意识、精神健康、脑与行为、心智哲学；心理学与认知科学的实证研究" },
  { key: "society", label: "社会与制度", section: "社会与制度", guide: "社会组织、阶层与流动、治理与公共政策、法律与权利、城市与社区、家庭与人口" },
  { key: "economy", label: "经济与市场", section: "社会与制度", guide: "经济行为、劳动与就业、不平等与分配、全球化与贸易、发展与增长、金钱的社会面向" },
  { key: "education", label: "教育与成长", section: "社会与制度", guide: "学习科学、教育政策与教学实践、大学与学术职业、发展与养育" },
  { key: "culture", label: "身份与文化", section: "文化与历史", guide: "族群与种族、性别与性、宗教与信仰、仪式与日常、亚文化与流行文化、移民与离散" },
  { key: "history", label: "历史与记忆", section: "文化与历史", guide: "史学研究、历史社会学、记忆与纪念、档案与物质文化、全球史与区域史" },
  { key: "tech", label: "技术与未来", section: "伦理与技术", guide: "技术的社会影响、AI 治理与伦理、数字生活与平台、生物技术与人类增强、气候与环境未来" },
  { key: "ethics", label: "伦理与价值", section: "伦理与技术", guide: "道德哲学、政治哲学、正义与自由、应用伦理（医疗、环境、技术、动物）、宗教伦理" },
  { key: "knowledge", label: "知识与科学", section: "知识与方法", guide: "认识论、科学哲学与方法论、复现与学术诚信、出版与同行评议、学术体制与经费" },
  { key: "language", label: "语言与意义", section: "知识与方法", guide: "语言学、语义与语用、翻译、修辞与话语分析、文学理论与批评方法" },
  { key: "essays", label: "公共讨论", section: "长文与论争", guide: "面向公众的长文、评论、访谈、书评与论争；跨学科、以观点与论证为主而非以经验数据为主的思想媒体文章" },
] as const;

/**
 * 内容理解一步给每篇资料判的“内容类型”（写在 prompts/content-understanding.md 里，改了类型要同步改那份提示词）。
 * 评分提示词（prompts/selection-score.md）按类型给五个维度不同的权重。
 */
export const ITEM_TYPES = [
  "empirical_study", "theory_argument", "review_synthesis", "longform_essay",
  "public_debate", "policy_report", "institutional_news", "explainer_teaching",
] as const;

// ── 标签词表 ────────────────────────────────────────────────────────────────────────────

/** 每篇资料的第一个标签必须是这些“分类标签”之一。 */
export const CATEGORY_TAGS = [
  "心理学研究", "心理健康", "认知科学", "社会学研究", "政治与治理", "法律与权利", "经济研究",
  "劳动与不平等", "人类学研究", "性别与性", "宗教与信仰", "文化与艺术", "技术与社会", "AI伦理",
  "气候与环境", "伦理学", "政治哲学", "认识论与科学哲学", "方法论与统计", "学术体制与诚信",
  "历史研究", "语言学", "文学与批评", "教育研究", "公共讨论", "书评", "访谈", "其他",
] as const;

/**
 * 信源分区：预印本（未经同行评议）单独收，不与新闻混排。
 * sources.json 里预印本源打的就是这个 tag（PsyArXiv / SocArXiv / arXiv 等）。
 * 全部动态默认排除，底部只提示「另有 N 条」；单独成页 /preprints。
 */
export const SOURCE_SECTIONS = [
  { tag: "预印本", path: "/preprints", label: "预印本" },
] as const;

/**
 * 可选的主题标签：前一半是学科与研究方向，后一半是内容形态。
 *
 * 最后两个是「选题标签」：内容理解那一步额外判定的“这条能不能做成一条内容（视频/图文）”的结果，
 * 只用于选题榜（/topics/pitch-strong、/topics/pitch-pool），不参与分类与日报分节。
 * 判据要严：能讲给外行听、有反直觉或冲突、有具体的人和场景、能接上当前公共讨论——
 * 四条里中三条才是「选题-强」，中两条是「选题-中」，其余不标。宁缺勿滥，大多数内容不该带这两个标签。
 */
export const TOPIC_TAGS = [
  "哲学", "社会学", "心理学", "人类学", "政治学", "经济学", "历史学", "文学理论", "语言学",
  "教育学", "传播学", "法学", "认知科学", "宗教研究", "性别研究", "文化研究",
  "科学技术与社会STS", "犯罪学", "人口学", "人文地理", "环境人文", "公共卫生", "精神分析",
  "伦理学", "美学", "逻辑学",
  "论文与预印本", "调查数据", "理论工作", "长文", "政策报告", "复现研究",
  "选题-强", "选题-中",
] as const;

/** 可选的实体标签（研究机构、学会、期刊）。 */
export const ENTITY_TAGS = [
  "NBER", "Pew Research Center", "Brookings", "Max Planck", "Santa Fe Institute",
  "Nature Human Behaviour", "Science", "PNAS", "Mind", "Ethics",
  "American Sociological Review", "American Political Science Review", "American Economic Review",
  "American Psychologist", "Cognition", "American Anthropologist", "American Historical Review",
  "Critical Inquiry", "APA", "APS", "ASA", "APSA", "AAA", "OSF", "PhilPapers", "SSRN", "WHO", "OECD",
] as const;

/** 模型常写的近义词，统一成词表里的写法。 */
export const TAG_SYNONYMS: Readonly<Record<string, string>> = {
  研究: "论文与预印本", 论文: "论文与预印本", paper: "论文与预印本", study: "论文与预印本",
  预印本: "论文与预印本", 工作论文: "论文与预印本",
  调查: "调查数据", 数据: "调查数据", 问卷: "调查数据", 民调: "调查数据",
  理论: "理论工作", 概念: "理论工作", 框架: "理论工作",
  综述: "论文与预印本", 系统综述: "复现研究",
  报告: "政策报告", 政策研究: "政策报告", 智库: "政策报告",
  随笔: "长文", 深度报道: "长文",
  心理: "心理学研究", 心理学: "心理学研究", 行为研究: "心理学研究", psychology: "心理学研究",
  认知: "认知科学", 神经科学: "认知科学", 认知神经: "认知科学",
  抑郁: "心理健康", 焦虑: "心理健康", 精神卫生: "心理健康",
  社会: "社会学研究", 社会学: "社会学研究", 社会结构: "社会学研究", sociology: "社会学研究",
  政治: "政治与治理", 治理: "政治与治理", 民主: "政治与治理", 选举: "政治与治理", politics: "政治与治理",
  法律: "法律与权利", 司法: "法律与权利", 权利: "法律与权利", law: "法律与权利",
  经济: "经济研究", 经济学: "经济研究", 市场: "经济研究", 金融: "经济研究", economics: "经济研究",
  劳动: "劳动与不平等", 就业: "劳动与不平等", 阶层: "劳动与不平等", 不平等: "劳动与不平等", 工资: "劳动与不平等",
  人类学: "人类学研究", 民族志: "人类学研究", 田野: "人类学研究", anthropology: "人类学研究",
  性别: "性别与性", 女性主义: "性别与性", 酷儿: "性别与性", 性别研究: "性别与性",
  宗教: "宗教与信仰", 信仰: "宗教与信仰", 神学: "宗教与信仰", religion: "宗教与信仰",
  文化: "文化与艺术", 艺术: "文化与艺术", 音乐: "文化与艺术", 电影: "文化与艺术",
  技术: "技术与社会", 科技: "技术与社会", AI: "AI伦理", 人工智能: "AI伦理", 算法: "技术与社会",
  数字: "技术与社会", 平台: "技术与社会", 社交媒体: "技术与社会",
  气候: "气候与环境", 环境: "气候与环境", 生态: "气候与环境", 可持续: "气候与环境",
  伦理: "伦理学", 道德: "伦理学", ethics: "伦理学", 生物伦理: "伦理学", 医学伦理: "伦理学",
  正义: "政治哲学", 自由: "政治哲学", 平等: "政治哲学", 政治理论: "政治哲学", 政治哲学: "政治哲学",
  认识论: "认识论与科学哲学", 科学哲学: "认识论与科学哲学", 知识论: "认识论与科学哲学",
  复现: "方法论与统计", 可重复性: "方法论与统计", 统计: "方法论与统计", 方法: "方法论与统计",
  因果推断: "方法论与统计", 预注册: "方法论与统计", 元分析: "方法论与统计",
  撤稿: "学术体制与诚信", 学术不端: "学术体制与诚信", 同行评议: "学术体制与诚信", 学术出版: "学术体制与诚信",
  大学: "教育研究", 高等教育: "教育研究", 教学: "教育研究", 学习: "教育研究", education: "教育研究",
  历史: "历史研究", 史学: "历史研究", 记忆: "历史研究", 档案: "历史研究", history: "历史研究",
  语言: "语言学", 语义: "语言学", 语法: "语言学", 翻译: "语言学", linguistics: "语言学",
  修辞: "语言学", 话语: "语言学", 文学理论: "文学与批评", 文学: "文学与批评", 批评: "文学与批评", 书评: "书评",
  评论: "公共讨论", 观点: "公共讨论", 论争: "公共讨论", 访谈: "访谈", 对谈: "访谈",
  公共写作: "公共讨论", 长文: "公共讨论",
};

/** 模型漏了分类标签时，按内容类型补一个。 */
export const CATEGORY_BY_ITEM_TYPE: Readonly<Record<string, string>> = {
  empirical_study: "认知科学", theory_argument: "伦理学", review_synthesis: "方法论与统计",
  longform_essay: "公共讨论", public_debate: "公共讨论", policy_report: "政治与治理",
  institutional_news: "学术体制与诚信", explainer_teaching: "教育研究",
};

// ── 机构与期刊（主体） ──────────────────────────────────────────────────────────────────

/** 主体主题：id → 显示名、卡片上显示的标签（null 表示只用 entity:<id> 归类）、别名。 */
export const ENTITIES: Record<string, { name: string; displayTag: string | null; aliases: string[] }> = {
  // 研究机构与智库
  nber: { name: "NBER 美国国家经济研究局", displayTag: "NBER", aliases: ["NBER", "National Bureau of Economic Research", "美国国家经济研究局"] },
  pew: { name: "Pew Research Center", displayTag: "Pew", aliases: ["Pew Research Center", "Pew", "皮尤研究中心"] },
  brookings: { name: "Brookings", displayTag: "Brookings", aliases: ["Brookings", "Brookings Institution", "布鲁金斯学会"] },
  maxplanck: { name: "Max Planck Society", displayTag: null, aliases: ["Max Planck", "Max-Planck", "马克斯·普朗克"] },
  santafe: { name: "Santa Fe Institute", displayTag: null, aliases: ["Santa Fe Institute", "圣塔菲研究所"] },
  // 学会（缩写极易混淆，见 IDENTITY_LEXICON）
  apa: { name: "美国心理学会 APA", displayTag: null, aliases: ["American Psychological Association", "美国心理学会"] },
  aps: { name: "心理科学协会 APS", displayTag: null, aliases: ["Association for Psychological Science", "心理科学协会"] },
  asa: { name: "美国社会学会 ASA", displayTag: null, aliases: ["American Sociological Association", "美国社会学会"] },
  apsa: { name: "美国政治学会 APSA", displayTag: null, aliases: ["American Political Science Association", "美国政治学会"] },
  aaa: { name: "美国人类学学会 AAA", displayTag: null, aliases: ["American Anthropological Association", "美国人类学学会"] },
  // 国际组织
  who: { name: "WHO", displayTag: "WHO", aliases: ["WHO", "World Health Organization", "世界卫生组织"] },
  oecd: { name: "OECD", displayTag: null, aliases: ["OECD", "经合组织", "经济合作与发展组织"] },
  unesco: { name: "UNESCO", displayTag: null, aliases: ["UNESCO", "联合国教科文组织"] },
  worldbank: { name: "World Bank", displayTag: null, aliases: ["World Bank", "世界银行"] },
  // 期刊与平台（发在自家官网的稿子）
  naturehb: { name: "Nature Human Behaviour", displayTag: "Nature Human Behaviour", aliases: ["Nature Human Behaviour"] },
  science: { name: "Science", displayTag: "Science", aliases: ["Science"] },
  pnas: { name: "PNAS", displayTag: null, aliases: ["PNAS", "Proceedings of the National Academy of Sciences"] },
  mind: { name: "Mind", displayTag: null, aliases: ["Mind"] },
  ethics: { name: "Ethics", displayTag: null, aliases: ["Ethics: An International Journal of Social, Political, and Legal Philosophy"] },
  asr: { name: "American Sociological Review", displayTag: "ASR", aliases: ["American Sociological Review", "ASR"] },
  apsr: { name: "American Political Science Review", displayTag: "APSR", aliases: ["American Political Science Review", "APSR"] },
  aer: { name: "American Economic Review", displayTag: "AER", aliases: ["American Economic Review", "AER"] },
  cognition: { name: "Cognition", displayTag: null, aliases: ["Cognition"] },
  amanthro: { name: "American Anthropologist", displayTag: null, aliases: ["American Anthropologist"] },
  ahr: { name: "American Historical Review", displayTag: "AHR", aliases: ["American Historical Review", "AHR"] },
  criticalinquiry: { name: "Critical Inquiry", displayTag: null, aliases: ["Critical Inquiry"] },
  // 预印本与文献平台
  osf: { name: "OSF Preprints", displayTag: null, aliases: ["OSF", "OSF Preprints", "PsyArXiv", "SocArXiv", "EdArXiv", "MetaArXiv"] },
  philsci: { name: "PhilSci-Archive", displayTag: null, aliases: ["PhilSci-Archive", "PhilArchive"] },
  // 思想媒体
  aeon: { name: "Aeon", displayTag: "Aeon", aliases: ["Aeon", "Aeon Essays"] },
  psyche: { name: "Psyche", displayTag: null, aliases: ["Psyche"] },
  noema: { name: "Noema", displayTag: null, aliases: ["Noema", "Noema Magazine"] },
  bostonreview: { name: "Boston Review", displayTag: null, aliases: ["Boston Review"] },
  lrb: { name: "London Review of Books", displayTag: "LRB", aliases: ["London Review of Books", "LRB"] },
  quanta: { name: "Quanta Magazine", displayTag: null, aliases: ["Quanta", "Quanta Magazine"] },
};

/**
 * 身份词典：摘要和标题里出现的机构、期刊或学会，必须在原文里也出现过，否则退回原标题、丢掉摘要（防止模型张冠李戴）。
 * 人文社科里最容易认错的是**缩写**：APA 既可能是美国心理学会（American Psychological Association）也可能是美国哲学学会
 * （American Philosophical Association），APS、ASA、ASR 同样有歧义；把 A 学科的研究说成 B 学科的结论也是高发错误。
 */
export const IDENTITY_LEXICON: ReadonlyArray<{ id: string; name: string; patterns: RegExp[] }> = [
  { id: "nber", name: "NBER", patterns: [/\bNBER\b/, /National Bureau of Economic Research/, /美国国家经济研究局/] },
  { id: "pew", name: "Pew Research Center", patterns: [/Pew Research Center/, /皮尤研究中心/] },
  { id: "brookings", name: "Brookings", patterns: [/Brookings/, /布鲁金斯学会/] },
  { id: "maxplanck", name: "Max Planck", patterns: [/Max[-\s]?Planck/, /马克斯·普朗克/] },
  { id: "apa", name: "美国心理学会 APA", patterns: [/American Psychological Association/, /美国心理学会/] },
  { id: "aps", name: "心理科学协会 APS", patterns: [/Association for Psychological Science/, /心理科学协会/] },
  { id: "asa", name: "美国社会学会 ASA", patterns: [/American Sociological Association/, /美国社会学会/] },
  { id: "apsa", name: "美国政治学会 APSA", patterns: [/American Political Science Association/, /美国政治学会/] },
  { id: "aaa", name: "美国人类学学会 AAA", patterns: [/American Anthropological Association/, /美国人类学学会/] },
  { id: "who", name: "WHO", patterns: [/\bWHO\b/, /World Health Organization/, /世界卫生组织/] },
  { id: "oecd", name: "OECD", patterns: [/\bOECD\b/, /经合组织/] },
  { id: "worldbank", name: "World Bank", patterns: [/World Bank/, /世界银行/] },
  { id: "naturehb", name: "Nature Human Behaviour", patterns: [/Nature Human Behaviour/] },
  { id: "science", name: "Science", patterns: [/\bScience\b/] },
  { id: "pnas", name: "PNAS", patterns: [/\bPNAS\b/, /Proceedings of the National Academy of Sciences/] },
  { id: "osf", name: "OSF Preprints", patterns: [/\bOSF\b/, /PsyArXiv/, /SocArXiv/, /EdArXiv/, /MetaArXiv/] },
  { id: "philsci", name: "PhilSci-Archive", patterns: [/PhilSci-Archive/, /PhilArchive/] },
  { id: "aeon", name: "Aeon", patterns: [/\bAeon\b/] },
  { id: "noema", name: "Noema", patterns: [/\bNoema\b/] },
  { id: "lrb", name: "London Review of Books", patterns: [/London Review of Books/, /\bLRB\b/] },
];

/** 这些域名上的文章，发布方就是对应的机构或期刊（官网、预印本平台）。 */
export const PUBLISHER_DOMAINS: ReadonlyArray<{ entityId: string; domains: readonly string[] }> = [
  { entityId: "nber", domains: ["nber.org"] },
  { entityId: "pew", domains: ["pewresearch.org"] },
  { entityId: "brookings", domains: ["brookings.edu"] },
  { entityId: "maxplanck", domains: ["mpg.de"] },
  { entityId: "santafe", domains: ["santafe.edu"] },
  { entityId: "apa", domains: ["apa.org"] },
  { entityId: "aps", domains: ["psychologicalscience.org"] },
  { entityId: "asa", domains: ["asanet.org"] },
  { entityId: "apsa", domains: ["apsanet.org"] },
  { entityId: "aaa", domains: ["americananthro.org"] },
  { entityId: "who", domains: ["who.int"] },
  { entityId: "oecd", domains: ["oecd.org"] },
  { entityId: "unesco", domains: ["unesco.org"] },
  { entityId: "worldbank", domains: ["worldbank.org"] },
  { entityId: "naturehb", domains: ["nature.com"] },
  { entityId: "science", domains: ["science.org"] },
  { entityId: "pnas", domains: ["pnas.org"] },
  { entityId: "osf", domains: ["osf.io"] },
  { entityId: "philsci", domains: ["philsci-archive.pitt.edu", "philarchive.org"] },
  { entityId: "aeon", domains: ["aeon.co"] },
  { entityId: "psyche", domains: ["psyche.co"] },
  { entityId: "noema", domains: ["noemamag.com"] },
  { entityId: "lrb", domains: ["lrb.co.uk"] },
  { entityId: "quanta", domains: ["quantamagazine.org"] },
];

/** 原文里的这些写法也算提到了对应机构。 */
export const IDENTITY_CONTEXT_ALIASES: ReadonlyArray<{ entityId: string; pattern: RegExp }> = [
  { entityId: "apa", pattern: /(美国心理学会|American Psychological Association)/ },
  { entityId: "aps", pattern: /(心理科学协会|Association for Psychological Science)/ },
  { entityId: "who", pattern: /(WHO\s*[（(]?世界卫生组织|世界卫生组织\s*[（(]?WHO)/ },
  { entityId: "osf", pattern: /(开放科学框架|Open Science Framework)/ },
];
