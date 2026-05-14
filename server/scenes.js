/**
 * Soul Cosmos - 本地场景建议引擎
 * 根据用户画像 + 每日黄历生成 4 个场景卡片（0ms）
 * AI 融合在后台异步增强
 */
const { generateAlmanac } = require('./daily');

// 场景模板库
const SCENE_TEMPLATES = {
  zh: {
    Fire: {
      workplace: { title: '职场火花', body: '你的{element}元素本周在职场特别活跃。适合主动出击、提出新方案、争取资源。', advice: '本周主动约一位关键人物喝咖啡。' },
      relationship: { title: '情感温度', body: '{moon}月亮带来的情感波动需要你注意。{mbti}型的你在亲密关系中倾向{tendency}。', advice: '今晚放下手机，和身边的人好好聊十分钟。' },
      growth: { title: '内在火焰', body: '易经{hexagram}卦提醒你：{hexAdvice}。本周适合{growthAction}。', advice: '每天花5分钟写三件感恩的事。' },
      finance: { title: '财富能量', body: '{element}元素主导的你，本周财运{fortune}。{baziAdvice}', advice: '检视本月预算，砍掉一个不必要的订阅。' },
    },
    Earth: {
      workplace: { title: '稳固根基', body: '你的{element}元素本周适合巩固现有成果、优化流程、建立系统。', advice: '整理你的工作文档，建立一个可复用的模板。' },
      relationship: { title: '情感厚度', body: '{moon}月亮给你带来稳定的情感基调。{mbti}型的你擅长{tendency}。', advice: '给一位老朋友发一条问候消息。' },
      growth: { title: '扎根生长', body: '易经{hexagram}卦提醒你：{hexAdvice}。本周适合{growthAction}。', advice: '尝试一项需要耐心的手工活动。' },
      finance: { title: '财富积累', body: '{element}元素主导的你，本周财运{fortune}。{baziAdvice}', advice: '设置一个自动储蓄计划。' },
    },
    Air: {
      workplace: { title: '思维风暴', body: '你的{element}元素本周带来出色的沟通和创意能力。', advice: '本周在会议中多发言，你的想法值得一听。' },
      relationship: { title: '情感连接', body: '{moon}月亮激发你的社交需求。{mbti}型的你在关系中倾向{tendency}。', advice: '组织一次小型聚会，连接不同的朋友圈。' },
      growth: { title: '知识探索', body: '易经{hexagram}卦提醒你：{hexAdvice}。本周适合{growthAction}。', advice: '开始读一本你一直想读的书。' },
      finance: { title: '财富思维', body: '{element}元素主导的你，本周财运{fortune}。{baziAdvice}', advice: '研究一个新的投资概念或理财工具。' },
    },
    Water: {
      workplace: { title: '直觉导航', body: '你的{element}元素本周带来敏锐的洞察力。信任你的直觉。', advice: '记录你的第一直觉，周末验证准确度。' },
      relationship: { title: '情感深度', body: '{moon}月亮加深你的情感感知。{mbti}型的你擅长{tendency}。', advice: '和伴侣或挚友进行一次深度对话。' },
      growth: { title: '内在河流', body: '易经{hexagram}卦提醒你：{hexAdvice}。本周适合{growthAction}。', advice: '尝试冥想或写日记来梳理内心感受。' },
      finance: { title: '财富流动', body: '{element}元素主导的你，本周财运{fortune}。{baziAdvice}', advice: '检查是否有遗忘的自动扣款。' },
    },
  },
  en: {
    Fire: {
      workplace: { title: 'Sparks at Work', body: 'Your {element} energy is especially active in your career this week. Time to pitch ideas, chase leads, and take initiative.', advice: 'Schedule a coffee chat with a key decision-maker this week.' },
      relationship: { title: 'Emotional Heat', body: 'The {moon} Moon stirs your emotional world. As an {mbti}, you tend to {tendency} in relationships.', advice: 'Put your phone down tonight and have a real 10-minute conversation.' },
      growth: { title: 'Inner Flame', body: 'Hexagram {hexagram} reminds you: {hexAdvice}. This week, focus on {growthAction}.', advice: 'Write down three things you\'re grateful for each morning.' },
      finance: { title: 'Wealth Energy', body: '{element}-dominant energy brings {fortune} financial vibes. {baziAdvice}', advice: 'Review your subscriptions and cancel one you don\'t use.' },
    },
    Earth: {
      workplace: { title: 'Solid Ground', body: 'Your {element} energy favors consolidation this week. Optimize systems, document processes, build foundations.', advice: 'Create a reusable template for your most common task.' },
      relationship: { title: 'Emotional Depth', body: 'The {moon} Moon brings emotional stability. As an {mbti}, you excel at {tendency}.', advice: 'Send a thoughtful message to an old friend you haven\'t spoken to recently.' },
      growth: { title: 'Rooted Growth', body: 'Hexagram {hexagram} reminds you: {hexAdvice}. This week, focus on {growthAction}.', advice: 'Try a hands-on hobby that requires patience — gardening, cooking, or crafting.' },
      finance: { title: 'Wealth Building', body: '{element}-dominant energy brings {fortune} financial vibes. {baziAdvice}', advice: 'Set up an automatic savings transfer, even if it\'s small.' },
    },
    Air: {
      workplace: { title: 'Brainstorm Mode', body: 'Your {element} energy brings exceptional communication and creative ideation this week.', advice: 'Speak up in meetings — your ideas deserve to be heard.' },
      relationship: { title: 'Social Spark', body: 'The {moon} Moon activates your social needs. As an {mbti}, you tend to {tendency}.', advice: 'Host a small gathering connecting friends from different circles.' },
      growth: { title: 'Knowledge Quest', body: 'Hexagram {hexagram} reminds you: {hexAdvice}. This week, focus on {growthAction}.', advice: 'Start that book you\'ve been meaning to read — just the first chapter.' },
      finance: { title: 'Money Mindset', body: '{element}-dominant energy brings {fortune} financial vibes. {baziAdvice}', advice: 'Learn one new investment concept or financial tool.' },
    },
    Water: {
      workplace: { title: 'Intuition Guide', body: 'Your {element} energy brings sharp insight this week. Trust your gut feelings on complex decisions.', advice: 'Log your first instincts this week — check their accuracy on Friday.' },
      relationship: { title: 'Emotional Depth', body: 'The {moon} Moon deepens your emotional perception. As an {mbti}, you excel at {tendency}.', advice: 'Have one deep, meaningful conversation with someone you trust.' },
      growth: { title: 'Inner Current', body: 'Hexagram {hexagram} reminds you: {hexAdvice}. This week, focus on {growthAction}.', advice: 'Try 10 minutes of meditation or journaling to process your feelings.' },
      finance: { title: 'Wealth Flow', body: '{element}-dominant energy brings {fortune} financial vibes. {baziAdvice}', advice: 'Check for any forgotten recurring charges or subscriptions.' },
    },
  },
};

const TENDENCIES = {
  zh: { 'I': '深度思考后再表达', 'E': '通过交流获得能量', 'N': '关注可能性和直觉', 'S': '注重细节和实际', 'T': '用逻辑分析问题', 'F': '用同理心理解他人', 'J': '喜欢计划和秩序', 'P': '保持灵活和开放' },
  en: { 'I': 'think deeply before speaking', 'E': 'gain energy through interaction', 'N': 'focus on possibilities and intuition', 'S': 'pay attention to details and reality', 'T': 'analyze problems with logic', 'F': 'understand others through empathy', 'J': 'prefer planning and order', 'P': 'stay flexible and open' },
};

const HEX_ADVICE = {
  zh: { '乾': '把握时机，主动出击', '坤': '厚德载物，以柔克刚', '屯': '万事开头难，坚持就是胜利', '蒙': '虚心学习，不耻下问', '需': '耐心等待，时机未到', '讼': '避免争端，以和为贵', '师': '领导力觉醒，带领团队', '比': '团结协作，互助共赢' },
  en: { '乾': 'seize the moment and take initiative', '坤': 'cultivate patience and gentleness', '屯': 'persist through initial difficulties', '蒙': 'approach learning with humility', '需': 'practice patience — the time isn\'t right yet', '讼': 'avoid conflict, seek harmony', '师': 'step into leadership', '比': 'build alliances and collaborate' },
};

const GROWTH_ACTIONS = {
  zh: ['学习一项新技能', '建立一个新的日常习惯', '整理生活空间', '与不同领域的人交流', '尝试一种新的运动', '写一封给自己的信'],
  en: ['learning a new skill', 'building a new daily habit', 'decluttering your space', 'connecting with someone from a different field', 'trying a new form of exercise', 'writing a letter to your future self'],
};

const FORTUNE_LEVELS = {
  zh: ['平稳', '上升', '旺盛', '波动中蕴含机会'],
  en: ['steady', 'rising', 'strong', 'volatile but full of opportunity'],
};

const BAZI_ADVICE = {
  zh: { '火': '注意控制冲动消费', '土': '稳健投资为佳', '金': '适合谈判和签约', '水': '灵活应变，顺势而为', '木': '开源节流并重' },
  en: { 'Fire': 'watch for impulse spending', 'Earth': 'favor stable investments', 'Metal': 'good for negotiations and contracts', 'Water': 'stay adaptable and go with the flow', 'Wood': 'balance income growth with expense control' },
};

/**
 * 生成本地场景建议（0ms）
 */
function generateLocalScenes(profile, lang) {
  const isZh = lang === 'zh';
  const L = isZh ? 'zh' : 'en';
  const element = profile?.element || 'Fire';
  const moon = profile?.moon || 'Scorpio';
  const mbti = profile?.mbti || 'INFJ';
  const hexagram = profile?.hexagram || '乾';
  const baziElement = profile?.baziElement || element;

  const templates = SCENE_TEMPLATES[L][element] || SCENE_TEMPLATES[L].Fire;
  const tendency = TENDENCIES[L][mbti?.[0]] || TENDENCIES[L]['I'];
  const hexAdvice = HEX_ADVICE[L][hexagram] || (isZh ? '顺势而为' : 'go with the flow');
  const growthAction = GROWTH_ACTIONS[L][Math.floor(Math.random() * GROWTH_ACTIONS[L].length)];
  const fortune = FORTUNE_LEVELS[L][Math.floor(Math.random() * FORTUNE_LEVELS[L].length)];
  const baziAdvice = BAZI_ADVICE[L][baziElement] || BAZI_ADVICE[L]['火'];

  const fill = (str) => str
    .replace('{element}', isZh ? ({Fire:'火',Earth:'土',Air:'风',Water:'水'}[element] || '火') : element)
    .replace('{moon}', moon)
    .replace('{mbti}', mbti)
    .replace('{tendency}', tendency)
    .replace('{hexagram}', hexagram)
    .replace('{hexAdvice}', hexAdvice)
    .replace('{growthAction}', growthAction)
    .replace('{fortune}', fortune)
    .replace('{baziAdvice}', baziAdvice);

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const dateRange = isZh
    ? `${weekStart.getMonth()+1}月${weekStart.getDate()}日 - ${weekEnd.getMonth()+1}月${weekEnd.getDate()}日`
    : `${weekStart.toLocaleDateString('en',{month:'short',day:'numeric'})} - ${weekEnd.toLocaleDateString('en',{month:'short',day:'numeric'})}`;

  const tagColors = {
    workplace: { bg: 'rgba(96,165,250,0.1)', text: '#60a5fa' },
    relationship: { bg: 'rgba(244,114,182,0.1)', text: '#f472b6' },
    growth: { bg: 'rgba(52,211,153,0.1)', text: '#34d399' },
    finance: { bg: 'rgba(251,191,36,0.1)', text: '#fbbf24' },
  };

  const icons = { workplace: '💼', relationship: '💕', growth: '🌱', finance: '💰' };
  const tags = {
    zh: { workplace: '职场', relationship: '感情', growth: '成长', finance: '财运' },
    en: { workplace: 'Workplace', relationship: 'Relationships', growth: 'Personal Growth', finance: 'Finance' },
  };

  const scenes = ['workplace', 'relationship', 'growth', 'finance'].map(key => {
    const t = templates[key];
    return {
      icon: icons[key],
      title: fill(t.title),
      tag: tags[L][key],
      tagColor: tagColors[key].bg,
      tagTextColor: tagColors[key].text,
      body: fill(t.body),
      advice: fill(t.advice),
    };
  });

  return { dateRange, scenes };
}

module.exports = { generateLocalScenes };
