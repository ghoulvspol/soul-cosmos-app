/**
 * Soul Cosmos - 主应用逻辑
 */

// ========== 配置 ==========
const CONFIG = {
  isPremium: true,
  apiBase: window.location.origin,
  isDemo: false,
};

// 自动检测后端是否可用
(async function detectBackend() {
  try {
    const res = await fetch(CONFIG.apiBase + '/api/health', { signal: AbortSignal.timeout(2000) });
    const data = await res.json();
    CONFIG.isDemo = !data.status;
  } catch {
    CONFIG.isDemo = true;
  }
  const badge = document.getElementById('demoBadge');
  if (badge) badge.style.display = CONFIG.isDemo ? 'inline-block' : 'none';
})();

// ========== Demo Mock 数据 ==========
const DEMO_PROFILES = {
  en: {
    Aries: { keywords: ['Pioneering', 'Bold', 'Impulsive', 'Dynamic'], portrait: 'You are a force of nature — a firestarter with a heart that burns as fiercely as your ambition. Your Aries sun charges forward while your rising sign shapes how the world sees your unstoppable energy.' },
    Taurus: { keywords: ['Grounded', 'Sensual', 'Stubborn', 'Loyal'], portrait: 'You build empires brick by brick, with patience that others mistake for passivity. Beneath your calm exterior lies a fierce determination that moves mountains — slowly, but surely.' },
    Gemini: { keywords: ['Versatile', 'Curious', 'Restless', 'Witty'], portrait: 'You contain multitudes — two minds that never stop spinning, gathering stories, connecting dots others miss. Your gift is translation: turning complexity into conversation.' },
    Cancer: { keywords: ['Nurturing', 'Intuitive', 'Protective', 'Deep'], portrait: 'You feel everything at twice the volume of everyone else. Your shell protects an ocean of empathy — and those lucky enough to be let in find a depth of care that changes their lives.' },
    Leo: { keywords: ['Radiant', 'Generous', 'Dramatic', 'Warm'], portrait: 'You were born to shine, and the world is better for it. Your warmth is magnetic, your creativity boundless — but your greatest strength is making others feel like stars too.' },
    Virgo: { keywords: ['Precise', 'Analytical', 'Devoted', 'Humble'], portrait: 'You see the details everyone else misses — the crack in the system, the typo in the plan, the small act of kindness that makes everything work. Your perfectionism is service disguised as criticism.' },
    Libra: { keywords: ['Harmonious', 'Diplomatic', 'Idealistic', 'Charming'], portrait: 'You seek balance in a chaotic world, and your charm is the bridge between opposing forces. Beauty is not decoration to you — it is a moral imperative.' },
    Scorpio: { keywords: ['Intense', 'Perceptive', 'Transformative', 'Magnetic'], portrait: 'You see through surfaces to the truth beneath. Your intensity scares some and magnetizes others — but those who stay discover a loyalty and depth that is unmatched.' },
    Sagittarius: { keywords: ['Adventurous', 'Philosophical', 'Free-spirited', 'Honest'], portrait: 'You chase horizons, not possessions. Your optimism is not naivety — it is a deliberate choice to believe in possibility, even when the evidence says otherwise.' },
    Capricorn: { keywords: ['Ambitious', 'Disciplined', 'Strategic', 'Wise'], portrait: 'You play the long game while others chase instant gratification. Your ambition is not ego — it is responsibility. You build things that last.' },
    Aquarius: { keywords: ['Visionary', 'Independent', 'Humanitarian', 'Eccentric'], portrait: 'You think in futures that others cannot imagine. Your independence is not isolation — it is the freedom to see the world differently and build something better.' },
    Pisces: { keywords: ['Dreamy', 'Empathetic', 'Mystical', 'Creative'], portrait: 'You swim between worlds — reality and imagination, logic and intuition, self and other. Your sensitivity is not weakness; it is the antenna that receives signals others cannot hear.' },
  },
  zh: {
    Aries: { keywords: ['开拓者', '大胆', '冲动', '充满活力'], portrait: '你是自然的力量——一个内心燃烧着与野心同样炽热火焰的先行者。你的白羊座太阳勇往直前，而上升星座塑造了世界眼中你那不可阻挡的能量。' },
    Taurus: { keywords: ['踏实', '感性', '固执', '忠诚'], portrait: '你一砖一瓦地建造帝国，耐心被他人误认为被动。平静外表下蕴藏着移山填海的坚定决心——缓慢但确定。' },
    Gemini: { keywords: ['多变', '好奇', '不安分', '机智'], portrait: '你包罗万象——两个永不停歇的思维，收集故事，连接别人看不到的点。你的天赋是翻译：把复杂变成对话。' },
    Cancer: { keywords: ['温暖', '直觉', '保护欲', '深邃'], portrait: '你感受一切的强度是别人的两倍。你的壳保护着同理心的海洋——那些有幸被接纳的人会发现改变他们生命的深度关怀。' },
    Leo: { keywords: ['耀眼', '慷慨', '戏剧性', '温暖'], portrait: '你生来就是要发光的，世界因此而更美好。你的温暖有磁性，创造力无穷——但你最大的力量是让别人也觉得自己是明星。' },
    Virgo: { keywords: ['精确', '分析力', '奉献', '谦逊'], portrait: '你看到了别人忽略的细节——系统中的裂缝、计划中的错别字、让一切运转的小善举。你的完美主义是伪装成批评的服务。' },
    Libra: { keywords: ['和谐', '外交', '理想主义', '魅力'], portrait: '你在混乱的世界中寻求平衡，你的魅力是连接对立力量的桥梁。美对你来说不是装饰——是道德义务。' },
    Scorpio: { keywords: ['强烈', '洞察力', '变革', '有磁性'], portrait: '你看穿表象直达真相。你的强度让一些人害怕，让另一些人被吸引——但留下的人会发现无与伦比的忠诚和深度。' },
    Sagittarius: { keywords: ['冒险', '哲学', '自由', '诚实'], portrait: '你追逐地平线，而非财产。你的乐观不是天真——而是在证据指向相反方向时，依然选择相信可能性的刻意决定。' },
    Capricorn: { keywords: ['有野心', '自律', '有策略', '智慧'], portrait: '当别人追逐即时满足时，你在打长期战。你的野心不是自负——是责任感。你建造经久不衰的东西。' },
    Aquarius: { keywords: ['远见', '独立', '人道主义', '独特'], portrait: '你用别人无法想象的未来思考。你的独立不是孤立——而是以不同视角看待世界并构建更好事物的自由。' },
    Pisces: { keywords: ['梦幻', '共情', '神秘', '创造力'], portrait: '你在世界之间游弋——现实与想象、逻辑与直觉、自我与他人。你的敏感不是弱点；是接收别人听不到信号的天线。' },
  },
};

function getDemoProfile(sunName) {
  const lang = currentLang === 'zh' ? 'zh' : 'en';
  return DEMO_PROFILES[lang][sunName] || DEMO_PROFILES[lang]['Scorpio'];
}

// ========== 反馈记忆系统 (Memory) ==========
const Memory = {
  KEY: 'soul_memory',

  getAll() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || { feedback: [], weights: {}, version: 1 }; }
    catch { return { feedback: [], weights: {}, version: 1 }; }
  },

  save(data) {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  },

  // 记录用户反馈：'accurate' | 'inaccurate' | 'saved'
  addFeedback(insightType, feedback, content) {
    const mem = this.getAll();
    mem.feedback.push({
      type: insightType,      // 'daily' | 'profile' | 'relationship' | 'fengshui'
      rating: feedback,       // 'accurate' | 'inaccurate' | 'saved'
      content: content.slice(0, 200),
      timestamp: Date.now(),
    });
    // 更新权重
    if (!mem.weights[insightType]) mem.weights[insightType] = { accurate: 0, inaccurate: 0, saved: 0 };
    mem.weights[insightType][feedback] = (mem.weights[insightType][feedback] || 0) + 1;
    this.save(mem);
  },

  // 获取用户偏好摘要（注入AI Prompt）
  getContext() {
    const mem = this.getAll();
    if (mem.feedback.length === 0) return '';

    const recent = mem.feedback.slice(-10);
    const accurate = recent.filter(f => f.rating === 'accurate').map(f => f.type);
    const inaccurate = recent.filter(f => f.rating === 'inaccurate').map(f => f.type);
    const saved = recent.filter(f => f.rating === 'saved').map(f => f.type);

    let ctx = '\n[USER MEMORY - adapt your style based on past feedback]\n';
    if (accurate.length) ctx += `- Types rated ACCURATE (increase weight): ${[...new Set(accurate)].join(', ')}\n`;
    if (inaccurate.length) ctx += `- Types rated INACCURATE (be more cautious, use different angles): ${[...new Set(inaccurate)].join(', ')}\n`;
    if (saved.length) ctx += `- Types SAVED/FAVORITED (user likes these, increase frequency): ${[...new Set(saved)].join(', ')}\n`;
    const usage = mem.feedback.length > 20 ? 'extensively' : mem.feedback.length > 5 ? 'regularly' : 'recently';
    ctx += '- Total interactions: ' + mem.feedback.length + '. User has been using the app ' + usage + '.\n';
    return ctx;
  },

  getStats() {
    const mem = this.getAll();
    return {
      total: mem.feedback.length,
      accurate: mem.feedback.filter(f => f.rating === 'accurate').length,
      inaccurate: mem.feedback.filter(f => f.rating === 'inaccurate').length,
      saved: mem.feedback.filter(f => f.rating === 'saved').length,
    };
  },
};

// ========== 国际化 (i18n) ==========
let currentLang = localStorage.getItem('soul_lang') || 'en';

const I18N = {
  en: {
    // Nav
    'nav.features': 'Features', 'nav.circle': 'My Circle', 'nav.fengshui': 'Feng Shui',
    'nav.pricing': 'Pricing', 'nav.try': 'Try Free', 'nav.face': 'Face/Palm', 'nav.scenes': 'Scenes',
    // Hero
    'hero.badge': '✦ The World\'s First East-Meets-West Personality AI',
    'hero.title1': 'Discover Your', 'hero.title2': 'Multi-Dimensional', 'hero.title3': 'Soul Profile',
    'hero.desc': 'We fuse Western Astrology, Eastern Zi Wei Dou Shu, I Ching, MBTI, Palm Reading, Blood Type theory, and Social Psychology into one unified portrait of who you truly are.',
    'hero.cta': '✦ Generate My Soul Profile — Free', 'hero.learn': 'Learn More ↓',
    'hero.stat1': 'Wisdom Systems', 'hero.stat2': 'Fusion Engine', 'hero.stat3': 'Unique Profiles',
    // How It Works
    'how.title': 'How It Works', 'how.subtitle': 'From input to insight in 60 seconds.',
    'how.s1.title': 'Enter Your Birth Info', 'how.s1.desc': 'Date, time, and location of birth. That\'s all we need to calculate your natal chart and Zi Wei chart.',
    'how.s2.title': 'Take the MBTI Test', 'how.s2.desc': '60 questions, 5 minutes. Or import your existing MBTI type if you already know it.',
    'how.s3.title': 'AI Fuses Everything', 'how.s3.desc': 'Our AI doesn\'t just list each system — it synthesizes them into one coherent, deeply personal portrait.',
    'how.s4.title': 'Meet Your Soul', 'how.s4.desc': 'Receive your Soul Profile: keywords, core traits, shadow side, life theme, and daily personalized insights.',
    // Features
    'feat.title': 'Seven Dimensions of Self', 'feat.subtitle': 'Most apps give you one lens. We give you the full spectrum.',
    'feat.astro': 'Western Astrology', 'feat.astro.desc': 'Sun, Moon, Rising signs. Planetary aspects. House placements. The classic natal chart, deeply interpreted.',
    'feat.ziwei': 'Zi Wei Dou Shu', 'feat.ziwei.desc': 'The Emperor\'s Astrology — 1,400 years of Chinese star mapping. Your life palace, career palace, and 14 main stars.',
    'feat.mbti': 'MBTI Integration', 'feat.mbti.desc': 'Your cognitive function stack fused with your astrological profile. Not two separate reports — one unified insight.',
    'feat.palm': 'AI Palm & Face Reading', 'feat.palm.desc': 'Upload a photo. Our CV model reads your palm lines and facial structure. Ancient art meets modern AI.',
    'feat.blood': 'Blood Type Personality', 'feat.blood.desc': 'Japanese and Korean personality theory based on blood type. A surprisingly accurate behavioral predictor.',
    'feat.psych': 'Social Psychology', 'feat.psych.desc': 'Big Five traits, attachment style, love language. Scientific frameworks fused with mystical ones.',
    'feat.iching': 'I Ching (易经)', 'feat.iching.desc': '5,000 years of Chinese wisdom. 64 hexagrams revealing your life archetype, inner truth, and path forward.',
    'feat.tag.astro': 'Co-Star level depth', 'feat.tag.ziwei': 'Eastern wisdom',
    'feat.tag.mbti': 'Psychology + Stars', 'feat.tag.palm': 'AI-powered',
    'feat.tag.blood': 'East Asian science', 'feat.tag.psych': 'Evidence-based', 'feat.tag.iching': 'Ancient wisdom',
    // Try section
    'try.title': 'Generate Your Soul Profile', 'try.subtitle': 'Free. No signup required. Takes 2 minutes.',
    'try.step1': '✦ When and where were you born?', 'try.birth': 'Birth Date', 'try.time': 'Birth Time', 'try.city': 'Birth City',
    'try.step2': '✦ What\'s your MBTI type?', 'try.mbti.desc': 'Select your type, or answer 5 quick questions below.',
    'try.generating': 'Fusing 7 dimensions of your soul...',
    'try.unlock': 'Unlock Full Analysis — $9.99/mo', 'try.share': '✦ Share Soul Profile', 'try.premium': '✦ PREMIUM MEMBER — Full Access',
    'try.feedback': 'How accurate is this?', 'try.accurate': '👍 Accurate', 'try.inaccurate': '👎 Not accurate', 'try.save': '⭐ Save',
    'try.thanks': '✦ Thanks! Your feedback helps us get better.',
    // Face/Palm
    'photo.title': '🖐️ AI Face & Palm Reading', 'photo.subtitle': 'Upload a photo. Our AI reads your facial features and palm lines. Ancient art meets modern technology.',
    'photo.face': '📸 Face Reading', 'photo.face.upload': 'Upload a clear face photo', 'photo.face.hint': 'Click or drag & drop',
    'photo.palm': '🖐️ Palm Reading', 'photo.palm.upload': 'Upload a clear palm photo', 'photo.palm.hint': 'Click or drag & drop',
    'photo.analyze.face': '🔮 Analyze Face', 'photo.analyze.palm': '🔮 Analyze Palm',
    // Scenes
    'scene.title': '📅 This Week\'s Life Scenes', 'scene.subtitle': 'Dynamic advice for workplace, relationships, and personal growth — powered by your unique profile.',
    'scene.empty': 'Generate your profile first, then come back for weekly scene advice.',
    'scene.btn': '🔮 Generate This Week\'s Scenes',
    // Circle
    'circle.title': '🔮 My Circle — Relationship Intelligence',
    'circle.subtitle': 'Add the people around you. Get weekly insights on how to navigate every relationship.',
    'circle.add': 'Add Someone to Your Circle', 'circle.name': 'Their Name', 'circle.name.ph': 'e.g. Boss, Sarah, Mom...',
    'circle.birth': 'Their Birth Date', 'circle.mbti': 'Their MBTI (if known)', 'circle.btn': '✦ Add to My Circle',
    'circle.empty': 'Your circle is empty. Add your boss, colleagues, partner, or friends to get relationship insights.',
    'circle.forecast': '📅 This Week\'s Relationship Forecast', 'circle.refresh': '🔮 Refresh Forecast',
    'circle.analyze': '🔮 Analyze', 'circle.analyzing': 'Analyzing your relationship with',
    // Feng Shui
    'fs.title': '🏠 Feng Shui — Space Intelligence',
    'fs.subtitle': 'Analyze your home and office layout. Get personalized adjustments to improve energy flow.',
    'fs.home': '🏠 Home / Apartment', 'fs.office': '🏢 Office / Desk',
    'fs.home.title': '🏠 Home Analysis', 'fs.dir': 'Building Direction (Facing)', 'fs.door': 'Front Door Faces',
    'fs.bedroom': 'Bedroom Location', 'fs.bed': 'Bed Position', 'fs.concerns': 'Current Concerns (optional)',
    'fs.concerns.ph': 'e.g. poor sleep, money issues, relationship tension...', 'fs.analyze.home': '🔮 Analyze Home Feng Shui',
    'fs.office.title': '🏢 Office / Desk Analysis', 'fs.desk.dir': 'Desk Faces', 'fs.desk.pos': 'Desk Position',
    'fs.floor': 'Office Floor', 'fs.career': 'Your Career Goal', 'fs.career.ph': 'e.g. promotion, new job, business growth...',
    'fs.analyze.office': '🔮 Analyze Office Feng Shui',
    // Pricing
    'price.title': 'Choose Your Depth', 'price.subtitle': 'Start free. Go deeper when you\'re ready.',
    'price.free': 'Free', 'price.forever': 'forever',
    'price.premium': 'Premium', 'price.month': '/month',
    'price.annual': 'Annual', 'price.save': '/year (save 50%)',
    'price.popular': 'Most Popular',
    'price.free.f1': '✦ Basic Soul Profile (3 keywords)', 'price.free.f2': '✦ One-sentence portrait',
    'price.free.f3': '✦ 1 daily insight', 'price.free.f4': '✦ Share with friends',
    'price.prem.f1': '✦ Full 6-dimension analysis', 'price.prem.f2': '✦ Unlimited compatibility reports',
    'price.prem.f3': '✦ Daily personalized insights', 'price.prem.f4': '✦ Deep natal chart reading',
    'price.prem.f5': '✦ AI palm & face reading (v2)', 'price.prem.f6': '✦ Zi Wei Dou Shu analysis (v2)',
    'price.prem.f7': '✦ Priority AI responses',
    'price.ann.f1': '✦ Everything in Premium', 'price.ann.f2': '✦ Yearly soul evolution report',
    'price.ann.f3': '✦ Exclusive content', 'price.ann.f4': '✦ Early access to new features',
    // Footer
    'footer.desc': 'The world\'s first East-meets-West personality AI.',
    'footer.copy': '© 2026 Soul Cosmos. Built with ❤️ and stardust.',
    // Common
    'common.get.started': 'Get Started', 'common.start.trial': 'Start 7-Day Free Trial',
    'common.analyze.again': '← Analyze Again', 'common.back': '← Back', 'common.select.type': 'Select your type to continue',
    'common.generate': 'Generate Soul Profile →',
  },
  zh: {
    // Nav
    'nav.features': '功能', 'nav.circle': '关系圈', 'nav.fengshui': '风水',
    'nav.pricing': '定价', 'nav.try': '免费体验', 'nav.face': '面相手相', 'nav.scenes': '场景建议',
    // Hero
    'hero.badge': '✦ 全球首个东西方命理融合 AI',
    'hero.title1': '发现你的', 'hero.title2': '多维度', 'hero.title3': '灵魂画像',
    'hero.desc': '我们将西方星盘、东方紫微斗数、易经、MBTI、面相手相、血型和社会心理学融合成一个统一的人格画像。',
    'hero.cta': '✦ 免费生成灵魂画像', 'hero.learn': '了解更多 ↓',
    'hero.stat1': '智慧体系', 'hero.stat2': '融合引擎', 'hero.stat3': '独特画像',
    // How It Works
    'how.title': '使用方法', 'how.subtitle': '从输入到洞察，60秒搞定。',
    'how.s1.title': '输入出生信息', 'how.s1.desc': '出生日期、时间和地点。仅此而已，我们就能计算你的星盘和紫微命盘。',
    'how.s2.title': '做MBTI测试', 'how.s2.desc': '60道题，5分钟。或者直接导入你已知的MBTI类型。',
    'how.s3.title': 'AI融合一切', 'how.s3.desc': '我们的AI不只是罗列每个体系——它把它们融合成一个连贯的、深度个性化的画像。',
    'how.s4.title': '遇见你的灵魂', 'how.s4.desc': '收到你的灵魂画像：关键词、核心特质、阴影面、人生主题和每日个性化洞察。',
    // Features
    'feat.title': '七个维度的自我', 'feat.subtitle': '大多数App只给你一个视角。我们给你完整的光谱。',
    'feat.astro': '西方星盘', 'feat.astro.desc': '太阳、月亮、上升星座。行星相位。宫位分布。经典星盘，深度解读。',
    'feat.ziwei': '紫微斗数', 'feat.ziwei.desc': '帝王之学——1400年的中国星象体系。命宫、官禄宫、14颗主星。',
    'feat.mbti': 'MBTI 融合', 'feat.mbti.desc': '认知功能栈与星盘融合。不是两份报告——而是一个统一的洞察。',
    'feat.palm': 'AI 面相手相', 'feat.palm.desc': '上传照片，AI读取你的掌纹和面部特征。古老艺术遇见现代AI。',
    'feat.blood': '血型人格', 'feat.blood.desc': '日韩流行的血型人格理论。一个出奇准确的行为预测器。',
    'feat.psych': '社会心理学', 'feat.psych.desc': '大五人格、依恋类型、爱的语言。科学框架与神秘学的融合。',
    'feat.iching': '易经', 'feat.iching.desc': '五千年的中国智慧。64卦揭示你的人生原型、内在真相和前行之路。',
    'feat.tag.astro': '星盘级深度', 'feat.tag.ziwei': '东方智慧',
    'feat.tag.mbti': '心理学+星象', 'feat.tag.palm': 'AI驱动',
    'feat.tag.blood': '东亚科学', 'feat.tag.psych': '科学验证', 'feat.tag.iching': '古老智慧',
    // Try section
    'try.title': '生成你的灵魂画像', 'try.subtitle': '免费。无需注册。2分钟搞定。',
    'try.step1': '✦ 你的出生日期和地点？', 'try.birth': '出生日期', 'try.time': '出生时间', 'try.city': '出生城市',
    'try.step2': '✦ 你的 MBTI 类型？', 'try.mbti.desc': '选择你的类型，或回答5个快速问题。',
    'try.generating': '正在融合你灵魂的7个维度...',
    'try.unlock': '解锁完整分析 — $9.99/月', 'try.share': '✦ 分享灵魂画像', 'try.premium': '✦ 尊享会员 — 完整权限',
    'try.feedback': '这个分析准确吗？', 'try.accurate': '👍 准', 'try.inaccurate': '👎 不准', 'try.save': '⭐ 收藏',
    'try.thanks': '✦ 感谢反馈！你的反馈帮我们变得更好。',
    // Face/Palm
    'photo.title': '🖐️ AI 面相手相分析', 'photo.subtitle': '上传照片，AI读取你的面部特征和掌纹。古老艺术遇见现代科技。',
    'photo.face': '📸 面相分析', 'photo.face.upload': '上传一张清晰的面部照片', 'photo.face.hint': '点击或拖拽上传',
    'photo.palm': '🖐️ 手相分析', 'photo.palm.upload': '上传一张清晰的手掌照片', 'photo.palm.hint': '点击或拖拽上传',
    'photo.analyze.face': '🔮 分析面相', 'photo.analyze.palm': '🔮 分析手相',
    // Scenes
    'scene.title': '📅 本周生活场景建议', 'scene.subtitle': '职场、感情、成长的动态建议——基于你的独特画像。',
    'scene.empty': '请先生成你的灵魂画像，然后回来查看每周场景建议。',
    'scene.btn': '🔮 生成本周场景建议',
    // Circle
    'circle.title': '🔮 关系圈 — 关系智能',
    'circle.subtitle': '添加你身边的人。获取每周关系洞察，教你如何应对每段关系。',
    'circle.add': '添加一个人到你的关系圈', 'circle.name': '他们的名字', 'circle.name.ph': '如：老板、小王、妈妈...',
    'circle.birth': '他们的生日', 'circle.mbti': '他们的 MBTI（如果知道）', 'circle.btn': '✦ 添加到关系圈',
    'circle.empty': '你的关系圈还是空的。添加你的老板、同事、伴侣或朋友，获取关系洞察。',
    'circle.forecast': '📅 本周关系预测', 'circle.refresh': '🔮 刷新预测',
    'circle.analyze': '🔮 分析', 'circle.analyzing': '正在分析你和TA的关系...',
    // Feng Shui
    'fs.title': '🏠 风水 — 空间智能',
    'fs.subtitle': '分析你的住宅和办公室布局。获取个性化调整建议，改善能量流动。',
    'fs.home': '🏠 住宅', 'fs.office': '🏢 办公室',
    'fs.home.title': '🏠 住宅分析', 'fs.dir': '建筑朝向', 'fs.door': '大门朝向',
    'fs.bedroom': '卧室位置', 'fs.bed': '床铺朝向', 'fs.concerns': '当前困扰（可选）',
    'fs.concerns.ph': '如：睡眠不好、财运不佳、关系紧张...', 'fs.analyze.home': '🔮 分析住宅风水',
    'fs.office.title': '🏢 办公室分析', 'fs.desk.dir': '办公桌朝向', 'fs.desk.pos': '办公桌位置',
    'fs.floor': '楼层', 'fs.career': '职业目标', 'fs.career.ph': '如：升职、换工作、业务增长...',
    'fs.analyze.office': '🔮 分析办公室风水',
    // Pricing
    'price.title': '选择你的深度', 'price.subtitle': '免费开始。准备好了再深入。',
    'price.free': '免费版', 'price.forever': '永久',
    'price.premium': '高级版', 'price.month': '/月',
    'price.annual': '年度版', 'price.save': '/年（省50%）',
    'price.popular': '最受欢迎',
    'price.free.f1': '✦ 基础灵魂画像（3个关键词）', 'price.free.f2': '✦ 一句话画像描述',
    'price.free.f3': '✦ 每日1条洞察', 'price.free.f4': '✦ 分享给朋友',
    'price.prem.f1': '✦ 完整6维度分析', 'price.prem.f2': '✦ 无限关系匹配报告',
    'price.prem.f3': '✦ 每日个性化洞察', 'price.prem.f4': '✦ 深度星盘解读',
    'price.prem.f5': '✦ AI面相手相分析', 'price.prem.f6': '✦ 紫微斗数分析',
    'price.prem.f7': '✦ AI优先响应',
    'price.ann.f1': '✦ 高级版全部功能', 'price.ann.f2': '✦ 年度灵魂进化报告',
    'price.ann.f3': '✦ 独家内容', 'price.ann.f4': '✦ 新功能抢先体验',
    // Footer
    'footer.desc': '全球首个东西方命理融合AI。',
    'footer.copy': '© 2026 Soul Cosmos。用 ❤️ 和星尘打造。',
    // Common
    'common.get.started': '立即开始', 'common.start.trial': '开始7天免费试用',
    'common.analyze.again': '← 重新分析', 'common.back': '← 返回', 'common.select.type': '选择你的类型继续',
    'common.generate': '生成灵魂画像 →',
  },
};

function t(key) {
  return I18N[currentLang]?.[key] || I18N.en[key] || key;
}

function toggleLang() {
  currentLang = currentLang === 'en' ? 'zh' : 'en';
  localStorage.setItem('soul_lang', currentLang);
  applyLang();
  // 语言切换时重新渲染动态内容
  if (document.getElementById('resultState')?.classList.contains('hidden') === false) {
    // 结果已显示，不需要重新渲染
  }
}

// ========== 出生城市自定义输入 ==========
function toggleCustomCity(select) {
  const customInput = document.getElementById('birthCityCustom');
  if (select.value === 'custom') {
    customInput.style.display = 'block';
    customInput.focus();
  } else {
    customInput.style.display = 'none';
  }
}

function getBirthCity() {
  const select = document.getElementById('birthCity');
  if (select.value === 'custom') {
    return document.getElementById('birthCityCustom')?.value?.trim() || 'new_york';
  }
  return select.value;
}

// ========== 反馈提交 ==========
function submitFeedback(type, el) {
  const portrait = document.getElementById('resultPortrait')?.textContent || '';
  Memory.addFeedback('profile', type, portrait);

  // UI反馈
  document.querySelectorAll('.feedback-btn').forEach(b => b.classList.remove('selected'));
  if (el) el.classList.add('selected');
  document.getElementById('feedbackThanks').style.display = 'block';

  setTimeout(() => {
    document.getElementById('feedbackThanks').style.display = 'none';
  }, 3000);
}

// ========== 面相/手相上传 ==========
function initPhotoUpload() {
  ['faceZone', 'palmZone'].forEach(zoneId => {
    const zone = document.getElementById(zoneId);
    if (!zone) return;

    zone.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => handlePhotoUpload(zoneId, e.target.files[0]);
      input.click();
    });

    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault(); zone.classList.remove('dragover');
      handlePhotoUpload(zoneId, e.dataTransfer.files[0]);
    });
  });
}

function handlePhotoUpload(zoneId, file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const previewId = zoneId === 'faceZone' ? 'facePreview' : 'palmPreview';
    const imgId = zoneId === 'faceZone' ? 'faceImg' : 'palmImg';
    const preview = document.getElementById(previewId);
    const img = document.getElementById(imgId);
    if (preview && img) {
      img.src = e.target.result;
      preview.style.display = 'block';
    }
    // 存储图片数据
    window._uploadedPhotos = window._uploadedPhotos || {};
    window._uploadedPhotos[zoneId === 'faceZone' ? 'face' : 'palm'] = e.target.result;
  };
  reader.readAsDataURL(file);
}

function analyzePhoto(type) {
  const photoData = window._uploadedPhotos?.[type];
  if (!photoData) { alert('Please upload a photo first'); return; }

  const resultEl = document.getElementById(type + 'PhotoResult');
  const contentEl = document.getElementById(type + 'PhotoContent');
  if (!resultEl || !contentEl) return;

  resultEl.style.display = 'block';
  contentEl.innerHTML = '<div style="text-align:center;padding:20px"><div class="loading-spinner"></div><p style="font-size:13px;color:#94a3b8;margin-top:8px">Analyzing...</p></div>';

  fetch(`${CONFIG.apiBase}/api/photo-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type, // 'face' or 'palm'
      userProfile: getUserProfile(),
      lang: currentLang,
    }),
  })
    .then(r => r.json())
    .then(data => {
      const r = data.analysis || {};
      const isZh = currentLang === 'zh';
      const titleFace = isZh ? '🖐️ 面相分析' : '🖐️ Face Reading Analysis';
      const titlePalm = isZh ? '🖐️ 手相分析' : '🖐️ Palm Reading Analysis';
      const adviceLabel = isZh ? '🎯 建议：' : '🎯 Advice:';
      const failMsg = isZh ? '分析失败，请重试。' : 'Analysis failed. Please try again.';
      contentEl.innerHTML = `
        <h3>${type === 'face' ? titleFace : titlePalm}</h3>
        <p>${r.summary || ''}</p>
        ${r.traits?.map(t => `<div class="fengshui-tip">✦ <strong>${t.name}:</strong> ${t.description}</div>`).join('') || ''}
        ${r.advice ? `<div class="scene-card-advice"><strong>${adviceLabel}</strong> ${r.advice}</div>` : ''}
      `;
    })
    .catch(() => {
      contentEl.innerHTML = '<div style="color:#f28b82;text-align:center;padding:20px">' + failMsg + '</div>';
    });
}

function getUserProfile() {
  const birthDate = document.getElementById('birthDate')?.value || '1995-06-15';
  const birthTime = document.getElementById('birthTime')?.value || '12:00';
  const birthCity = getBirthCity();
  const chart = Astrology.getNatalChart(birthDate, birthTime, birthCity);
  return {
    sun: chart.sun.name, moon: chart.moon.name, rising: chart.rising.name,
    element: chart.dominantElement, mbti: selectedMBTI || 'Unknown',
  };
}

// ========== 周度场景建议 ==========
function loadScenes() {
  const container = document.getElementById('sceneContent');
  if (!container) return;

  container.innerHTML = '<div style="text-align:center;padding:40px"><div class="loading-spinner"></div></div>';

  fetch(`${CONFIG.apiBase}/api/scenes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userProfile: getUserProfile(), lang: currentLang }),
  })
    .then(r => r.json())
    .then(data => {
      if (data.scenes) {
        container.innerHTML = data.scenes.map(s => `
          <div class="scene-card">
            <div class="scene-card-header">
              <span class="scene-card-icon">${s.icon || '🔮'}</span>
              <span class="scene-card-title">${s.title}</span>
              <span class="scene-card-tag" style="background:${s.tagColor || 'rgba(139,92,246,0.1)'};color:${s.tagTextColor || '#a78bfa'}">${s.tag || ''}</span>
            </div>
            <div class="scene-card-body">${s.body || ''}</div>
            ${s.advice ? `<div class="scene-card-advice"><strong>🎯 Action:</strong> ${s.advice}</div>` : ''}
          </div>
        `).join('');
      }
    })
    .catch(() => {
      container.innerHTML = '<div style="color:#f28b82;text-align:center;padding:20px">Failed to load scenes.</div>';
    });
}

function applyLang() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const text = t(key);
    if (el.tagName === 'INPUT' && el.dataset.i18nPh) {
      el.placeholder = t(el.dataset.i18nPh);
    } else {
      el.textContent = text;
    }
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPh);
  });
  // 更新页面标题
  document.title = currentLang === 'zh' ? 'Soul Cosmos — 发现你的多维灵魂' : 'Soul Cosmos — Discover Your Multi-Dimensional Self';
  // 更新语言按钮
  const btn = document.getElementById('langToggle');
  if (btn) {
    btn.textContent = currentLang === 'en' ? '中文' : 'EN';
    btn.classList.toggle('active', currentLang === 'zh');
  }
}

// ========== 星空背景 ==========
function initStarfield() {
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');
  let stars = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createStars() {
    stars = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.02 + 0.005,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
      s.alpha += Math.sin(Date.now() * s.speed) * 0.01;
      s.alpha = Math.max(0.1, Math.min(1, s.alpha));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  resize();
  createStars();
  draw();
  window.addEventListener('resize', () => { resize(); createStars(); });
}

// ========== 页面滚动 ==========
function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

// ========== 导航滚动效果 ==========
window.addEventListener('scroll', () => {
  const nav = document.getElementById('nav');
  if (window.scrollY > 50) {
    nav.style.background = 'rgba(10,10,26,0.95)';
  } else {
    nav.style.background = 'rgba(10,10,26,0.8)';
  }
});

// ========== MBTI 选择 ==========
let selectedMBTI = null;

document.querySelectorAll('.mbti-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mbti-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedMBTI = btn.dataset.type;
    const nextBtn = document.getElementById('mbtiNextBtn');
    nextBtn.disabled = false;
    nextBtn.textContent = `Generate Soul Profile →`;
  });
});

// ========== 步骤切换 ==========
function showStep(num) {
  document.querySelectorAll('.try-step').forEach(s => s.classList.remove('active'));
  document.getElementById('step' + num)?.classList.add('active');
}

function nextStep(num) {
  showStep(num);
}

function prevStep(num) {
  showStep(num);
}

// ========== API 配置 ==========
const API_BASE = window.location.origin; // 同源，由后端代理

// ========== 生成灵魂画像（调用 Mimo 模型） ==========
function generateProfile() {
  if (!selectedMBTI) return;

  showStep(3);
  animateLoading();

  const birthDate = document.getElementById('birthDate').value;
  const birthTime = document.getElementById('birthTime').value;
  const birthCity = getBirthCity();

  // 本地计算星盘、紫微、易经
  const natalChart = Astrology.getNatalChart(birthDate, birthTime, birthCity);
  const ziweiChart = Astrology.getZiweiChart(birthDate);
  const ichingHexagram = IChing.getHexagramByBirth(birthDate, birthTime);
  const ichingInfo = IChing.getHexagramInfo(ichingHexagram);
  window._currentIching = ichingInfo; // 保存供渲染使用

  if (CONFIG.isDemo) {
    // Demo模式：使用本地mock数据
    setTimeout(() => {
      const demo = getDemoProfile(natalChart.sun.name);
      const ziweiKeywords = { '紫微': 'Regal', '天机': 'Clever', '太阳': 'Radiant', '武曲': 'Determined', '天同': 'Gentle', '廉贞': 'Passionate', '天府': 'Abundant', '太阴': 'Receptive', '贪狼': 'Ambitious', '巨门': 'Perceptive', '天相': 'Diplomatic', '天梁': 'Wise', '七杀': 'Fearless', '破军': 'Revolutionary' };
      const profile = {
        soulKeywords: [...demo.keywords.slice(0, 3), ziweiKeywords[ziweiChart.mainStar] || 'Unique'],
        oneSentencePortrait: demo.portrait,
        coreTraits: [
          { trait: currentLang === 'zh' ? '核心驱动力' : 'Core Drive', description: currentLang === 'zh' ? '你的' + natalChart.sun.name + '太阳赋予你独特的生命能量，与' + ziweiChart.mainStar + '星的特质交织，形成了你不可复制的人格底色。' : 'Your ' + natalChart.sun.name + ' sun grants you unique life force, intertwined with the qualities of ' + ziweiChart.mainStar + ' star, forming your irreplicable personality foundation.' },
          { trait: currentLang === 'zh' ? '社交界面' : 'Social Interface', description: currentLang === 'zh' ? '作为' + selectedMBTI + '型人格，你在社交中展现' + (selectedMBTI[0] === 'E' ? '外向' : '内向') + '的能量，结合' + natalChart.rising.name + '上升的气场，给人留下深刻印象。' : 'As an ' + selectedMBTI + ', you bring ' + (selectedMBTI[0] === 'E' ? 'extraverted' : 'introverted') + ' energy to social situations, combined with ' + natalChart.rising.name + ' rising presence.' },
          { trait: currentLang === 'zh' ? '易经指引' : 'I Ching Guidance', description: currentLang === 'zh' ? '你的本命卦是' + ichingHexagram.number + '. ' + ichingHexagram.name + '（' + ichingHexagram.english + '）：' + ichingHexagram.judgment : 'Your natal hexagram is ' + ichingHexagram.number + '. ' + ichingHexagram.english + ': ' + ichingHexagram.judgmentEn },
        ],
        shadows: [
          { challenge: currentLang === 'zh' ? '内在张力' : 'Inner Tension', description: currentLang === 'zh' ? '你的' + natalChart.moon.name + '月亮带来的情感深度，有时会与' + natalChart.rising.name + '上升的外在表现产生冲突。学会在两者之间找到平衡是你的人生课题。' : 'The emotional depth of your ' + natalChart.moon.name + ' moon sometimes conflicts with your ' + natalChart.rising.name + ' rising exterior. Finding balance between them is your life lesson.' },
        ],
        lifeTheme: currentLang === 'zh' ? '你的人生是一场在' + natalChart.sun.element + '元素的驱动下，不断探索自我边界的旅程。' + ichingHexagram.name + '卦提醒你：' + ichingHexagram.image : 'Your life is a journey of exploring your boundaries driven by the ' + natalChart.sun.element + ' element. Hexagram ' + ichingHexagram.english + ' reminds you: ' + ichingHexagram.imageEn,
        dailyInsight: currentLang === 'zh' ? '今天，你的' + natalChart.moon.name + '月亮能量特别活跃。关注内心的声音，它正在引导你走向正确的方向。' : 'Today, your ' + natalChart.moon.name + ' moon energy is especially active. Listen to your inner voice — it is guiding you in the right direction.',
      };
      renderResult(profile, natalChart, ziweiChart, 'demo');
    }, 2000);
  } else {
    // 真实AI模式：调用Mimo模型
    fetch(CONFIG.apiBase + '/api/generate-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ natalChart, mbtiType: selectedMBTI, ziweiChart, iching: ichingInfo, lang: currentLang }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        renderResult(data.profile, natalChart, ziweiChart, data.model);
      })
      .catch(err => {
        console.error('AI Error:', err);
        const profile = ProfileEngine.generate(natalChart, selectedMBTI, ziweiChart);
        renderResult(profile, natalChart, ziweiChart, 'local-fallback');
      });
  }
}

// ========== 加载动画 ==========
function animateLoading() {
  const loadingBar = document.getElementById('loadingBar');
  const loadingSteps = document.querySelectorAll('.ls-item');
  let progress = 0;

  window._loadingInterval = setInterval(() => {
    progress += Math.random() * 8 + 3;
    if (progress > 90) progress = 90; // 留10%等API返回
    loadingBar.style.width = progress + '%';

    const stepIndex = Math.floor((progress / 90) * loadingSteps.length);
    loadingSteps.forEach((s, i) => {
      s.classList.toggle('active', i <= stepIndex);
    });
  }, 400);
}

function stopLoading() {
  if (window._loadingInterval) clearInterval(window._loadingInterval);
  const loadingBar = document.getElementById('loadingBar');
  loadingBar.style.width = '100%';
  document.querySelectorAll('.ls-item').forEach(s => s.classList.add('active'));
}

// ========== 渲染结果 ==========
function renderResult(profile, natalChart, ziweiChart, model) {
  stopLoading();

  setTimeout(() => {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('resultState').classList.remove('hidden');

    // 模型标识
    const modelTag = model !== 'local-fallback'
      ? `<div style="font-size:10px;color:#64748b;margin-top:8px;">Powered by ${model}</div>`
      : '';

    // 关键词
    const keywords = profile.soulKeywords || profile.keywords || [];
    document.getElementById('resultKeywords').innerHTML = keywords.join(' · ') + modelTag;

    // 画像描述
    document.getElementById('resultPortrait').textContent =
      profile.oneSentencePortrait || profile.portrait || '';

    // 星座标签
    const zodiacEl = document.getElementById('resultZodiac');
    const ichingHex = window._currentIching;
    const ichingTag = ichingHex ? `☯️ ${ichingHex.symbol} ${ichingHex.number}. ${ichingHex.english}` : '';
    zodiacEl.innerHTML = [
      `☀ ${natalChart.sun.symbol} ${natalChart.sun.name} Sun`,
      `☽ ${natalChart.moon.symbol} ${natalChart.moon.name} Moon`,
      `↑ ${natalChart.rising.symbol} ${natalChart.rising.name} Rising`,
      `🧠 ${selectedMBTI}`,
      `☯ ${ziweiChart.mainStar}`,
      ichingTag,
    ].filter(Boolean).map(t => `<span class="zodiac-tag">${t}</span>`).join('');

    // 核心特质
    const traits = profile.coreTraits || profile.traits || [];
    const traitsEl = document.getElementById('resultTraits');
    traitsEl.innerHTML = traits.map(t =>
      `<div class="trait-item"><strong>${t.trait}</strong> — ${t.description || t.desc}</div>`
    ).join('');

    // 阴影面
    const shadows = profile.shadows || [];
    const shadowsEl = document.getElementById('resultShadows');
    shadowsEl.innerHTML = shadows.map(s =>
      `<div class="shadow-item"><strong>${s.challenge}</strong> — ${s.description || s.desc}</div>`
    ).join('');

    // 人生主题
    document.getElementById('resultTheme').textContent =
      profile.lifeTheme || '';

    // 每日洞察
    document.getElementById('resultDaily').textContent =
      profile.dailyInsight || '';

    // 测试环境：展示付费模式
    if (CONFIG.isPremium) {
      const badge = document.getElementById('premiumBadge');
      const unlockBtn = document.getElementById('unlockBtn');
      const ctaSub = document.getElementById('ctaSub');
      if (badge) badge.style.display = 'inline-block';
      if (unlockBtn) unlockBtn.style.display = 'none';
      if (ctaSub) ctaSub.textContent = 'Share your premium soul profile with friends';
    }

    // 滚动到结果
    document.getElementById('resultState').scrollIntoView({ behavior: 'smooth' });
  }, 500);
}

// ========== 重置 ==========
function resetProfile() {
  selectedMBTI = null;
  document.querySelectorAll('.mbti-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('mbtiNextBtn').disabled = true;
  document.getElementById('mbtiNextBtn').textContent = 'Select your type to continue';
  document.getElementById('loadingState').classList.remove('hidden');
  document.getElementById('resultState').classList.add('hidden');
  document.getElementById('loadingBar').style.width = '0%';
  document.querySelectorAll('.ls-item').forEach(s => s.classList.remove('active'));
  showStep(1);
}

// ========== 分享 ==========
function shareProfile() {
  const keywords = document.getElementById('resultKeywords').textContent;
  const text = `✦ My Soul Profile: ${keywords}\n\nDiscover yours at Soul Cosmos ✦`;

  if (navigator.share) {
    navigator.share({ title: 'My Soul Profile', text });
  } else {
    navigator.clipboard.writeText(text).then(() => {
      alert('Soul Profile copied to clipboard! Share it with your friends ✦');
    });
  }
}

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
  initStarfield();
  loadCircle();
  initPhotoUpload();
  applyLang();
});

// ========== Phase 2: My Circle 关系圈 ==========
let circlePeople = JSON.parse(localStorage.getItem('soul_circle') || '[]');

const RELATION_EMOJI = {
  boss: '👔', colleague: '👥', partner: '💕', friend: '🤝',
  family: '👨‍👩‍👧', client: '💼', crush: '💘',
};

function addPersonToCircle() {
  const name = document.getElementById('circleName').value.trim();
  const relation = document.getElementById('circleRelation').value;
  const birthDate = document.getElementById('circleBirthDate').value;
  const mbti = document.getElementById('circleMBTI').value;

  if (!name || !birthDate) {
    alert('Please enter their name and birth date');
    return;
  }

  const person = {
    id: Date.now().toString(36),
    name, relation, birthDate, mbti,
    zodiac: Astrology.getSunSign(
      ...birthDate.split('-').map(Number)
    ),
  };

  circlePeople.push(person);
  localStorage.setItem('soul_circle', JSON.stringify(circlePeople));

  // 清空表单
  document.getElementById('circleName').value = '';
  document.getElementById('circleBirthDate').value = '';

  renderCircle();
}

function removePersonFromCircle(id) {
  circlePeople = circlePeople.filter(p => p.id !== id);
  localStorage.setItem('soul_circle', JSON.stringify(circlePeople));
  renderCircle();
}

function loadCircle() {
  renderCircle();
}

function renderCircle() {
  const list = document.getElementById('circleList');
  const forecast = document.getElementById('weeklyForecast');

  if (circlePeople.length === 0) {
    list.innerHTML = `
      <div class="circle-empty">
        <div class="empty-icon">👥</div>
        <p>Your circle is empty. Add your boss, colleagues, partner, or friends to get relationship insights.</p>
      </div>`;
    forecast.style.display = 'none';
    return;
  }

  list.innerHTML = circlePeople.map(p => `
    <div class="circle-person">
      <div class="person-avatar">${RELATION_EMOJI[p.relation] || '👤'}</div>
      <div class="person-info">
        <div class="person-name">${p.name}</div>
        <div class="person-relation">${p.relation.charAt(0).toUpperCase() + p.relation.slice(1)}</div>
        <div class="person-zodiac">☀ ${p.zodiac.name} ${p.zodiac.symbol}${p.mbti ? ' · ' + p.mbti : ''}</div>
      </div>
      <div class="person-actions">
        <button class="person-btn" onclick="analyzeRelationship('${p.id}')">🔮 Analyze</button>
        <button class="person-btn person-btn-danger" onclick="removePersonFromCircle('${p.id}')">✕</button>
      </div>
    </div>
  `).join('');

  forecast.style.display = 'block';
}

function analyzeRelationship(personId) {
  const person = circlePeople.find(p => p.id === personId);
  if (!person) return;

  const birthDate = document.getElementById('birthDate').value || '1995-06-15';
  const birthTime = document.getElementById('birthTime').value || '12:00';
  const birthCity = getBirthCity() || 'new_york';
  const myChart = Astrology.getNatalChart(birthDate, birthTime, birthCity);

  const loading = document.createElement('div');
  loading.className = 'forecast-card';
  loading.innerHTML = '<div style="text-align:center;padding:20px"><div class="loading-spinner"></div><p style="font-size:13px;color:#94a3b8;margin-top:8px">Analyzing your relationship with ' + person.name + '...</p></div>';

  const resultArea = document.getElementById('forecastContent');
  resultArea.prepend(loading);

  fetch(`${CONFIG.apiBase}/api/compatibility`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profileA: { sun: myChart.sun.name, moon: myChart.moon.name, rising: myChart.rising.name, mbti: selectedMBTI || 'Unknown' },
      profileB: { sun: person.zodiac.name, moon: 'Unknown', rising: 'Unknown', mbti: person.mbti || 'Unknown' },
      relationship: person.relation,
      context: `This is my ${person.relation}. Give practical advice on how to interact with them this week.`,
      lang: currentLang,
    }),
  })
    .then(r => r.json())
    .then(data => {
      const c = data.compatibility || {};
      const scoreClass = (c.score || 50) >= 70 ? 'score-good' : (c.score || 50) >= 40 ? 'score-neutral' : 'score-caution';
      loading.innerHTML = `
        <div class="forecast-card-header">
          <span>${RELATION_EMOJI[person.relation]} ${person.name}</span>
          <span class="forecast-card-relation">${person.relation}</span>
          <span class="forecast-card-score ${scoreClass}">${c.score || 50}/100</span>
        </div>
        <div class="forecast-card-text">
          ${c.description || 'Analysis complete.'}<br><br>
          <strong>Strengths:</strong> ${(c.strengths || []).join(', ')}<br>
          <strong>Watch out:</strong> ${(c.challenges || []).join(', ')}<br>
          <strong>Advice:</strong> ${c.advice || 'Be authentic and open.'}
        </div>`;
    })
    .catch(() => {
      loading.innerHTML = `<div class="forecast-card-text" style="color:#f28b82">Analysis failed. Please try again.</div>`;
    });
}

function generateWeeklyForecast() {
  if (circlePeople.length === 0) return;

  const resultArea = document.getElementById('forecastContent');
  resultArea.innerHTML = '<div style="text-align:center;padding:40px"><div class="loading-spinner"></div><p style="font-size:13px;color:#94a3b8;margin-top:8px">Generating this week\'s forecast...</p></div>';

  const birthDate = document.getElementById('birthDate').value || '1995-06-15';
  const birthTime = document.getElementById('birthTime').value || '12:00';
  const birthCity = getBirthCity() || 'new_york';
  const myChart = Astrology.getNatalChart(birthDate, birthTime, birthCity);

  fetch(`${CONFIG.apiBase}/api/weekly-forecast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      myProfile: { sun: myChart.sun.name, moon: myChart.moon.name, rising: myChart.rising.name, mbti: selectedMBTI || 'Unknown' },
      people: circlePeople.map(p => ({
        name: p.name, relation: p.relation,
        sun: p.zodiac.name, mbti: p.mbti || 'Unknown',
      })),
      lang: currentLang,
    }),
  })
    .then(r => r.json())
    .then(data => {
      if (data.forecasts) {
        resultArea.innerHTML = data.forecasts.map((f, i) => {
          const p = circlePeople[i];
          const scoreClass = (f.score || 50) >= 70 ? 'score-good' : (f.score || 50) >= 40 ? 'score-neutral' : 'score-caution';
          return `
            <div class="forecast-card">
              <div class="forecast-card-header">
                <span>${RELATION_EMOJI[p?.relation]} ${f.name}</span>
                <span class="forecast-card-relation">${p?.relation || ''}</span>
                <span class="forecast-card-score ${scoreClass}">${f.score || 50}/100</span>
              </div>
              <div class="forecast-card-text">${f.advice || ''}</div>
            </div>`;
        }).join('');
      }
    })
    .catch(() => {
      resultArea.innerHTML = '<div style="color:#f28b82;text-align:center;padding:20px">Forecast generation failed.</div>';
    });
}

// ========== Phase 3: Feng Shui 风水 ==========
let currentSpaceType = 'home';

function selectSpaceType(type) {
  currentSpaceType = type;
  document.querySelectorAll('.fengshui-type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === type));
  document.getElementById('fengshuiHomeForm').style.display = type === 'home' ? 'block' : 'none';
  document.getElementById('fengshuiOfficeForm').style.display = type === 'office' ? 'block' : 'none';
  document.getElementById('fengshuiResult').style.display = 'none';
}

function analyzeFengShui(type) {
  const resultEl = document.getElementById('fengshuiResult');
  const contentEl = document.getElementById('fengshuiResultContent');

  resultEl.style.display = 'block';
  contentEl.innerHTML = '<div style="text-align:center;padding:40px"><div class="loading-spinner"></div><p style="font-size:13px;color:#94a3b8;margin-top:8px">Analyzing feng shui...</p></div>';

  let params = {};
  if (type === 'home') {
    params = {
      type: 'home',
      direction: document.getElementById('homeDirection').value,
      doorDirection: document.getElementById('doorDirection').value,
      bedroomLocation: document.getElementById('bedroomLocation').value,
      bedPosition: document.getElementById('bedPosition').value,
      concerns: document.getElementById('homeConcerns').value,
    };
  } else {
    params = {
      type: 'office',
      deskDirection: document.getElementById('deskDirection').value,
      deskPosition: document.getElementById('deskPosition').value,
      floor: document.getElementById('officeFloor').value,
      careerGoal: document.getElementById('careerGoal').value,
    };
  }

  // 也传入用户的命理数据
  const birthDate = document.getElementById('birthDate').value || '1995-06-15';
  const birthTime = document.getElementById('birthTime').value || '12:00';
  const myChart = Astrology.getNatalChart(birthDate, birthTime, 'new_york');

  params.lang = currentLang;
  params.userProfile = {
    sun: myChart.sun.name,
    element: myChart.dominantElement,
    mbti: selectedMBTI || 'Unknown',
  };

  fetch(`${CONFIG.apiBase}/api/fengshui`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
    .then(r => r.json())
    .then(data => {
      const fs = data.fengshui || {};
      contentEl.innerHTML = `
        <h3>🏠 ${type === 'home' ? 'Home' : 'Office'} Feng Shui Analysis</h3>
        <div class="fengshui-score">
          <div class="fengshui-score-num" style="color:${(fs.score||50)>=70?'#6fcf97':(fs.score||50)>=40?'#ffd700':'#f28b82'}">${fs.score || 50}</div>
          <div class="fengshui-score-label">Feng Shui Score<br><small>Based on your birth element and space layout</small></div>
        </div>
        <h4>✦ Overall Assessment</h4>
        <p>${fs.overall || ''}</p>
        <h4>✦ Recommendations</h4>
        ${(fs.tips || []).map(t => `<div class="fengshui-tip">✅ ${t}</div>`).join('')}
        ${fs.warnings?.length ? '<h4>⚠️ Warnings</h4>' + fs.warnings.map(w => `<div class="fengshui-warning">⚠️ ${w}</div>`).join('') : ''}
        <h4>✦ Lucky Elements for You</h4>
        <p>${fs.luckyElements || ''}</p>
      `;
    })
    .catch(() => {
      contentEl.innerHTML = '<div style="color:#f28b82;text-align:center;padding:20px">Analysis failed. Please try again.</div>';
    });
}
