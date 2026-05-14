/**
 * Soul Cosmos - 后端代理服务
 * Soul Cosmos 后端 API 服务
 */
const express = require('express');
const path = require('path');
const { execSync } = require('child_process');
const { optionalAuth } = require('./auth');
const kepa = require('./kepa');

const app = express();

/**
 * 调用 Python 八字排盘引擎
 */
function calculateBazi(birthDate, birthTime, gender) {
  try {
    const [year, month, day] = birthDate.split('-').map(Number);
    const [hour] = (birthTime || '12:00').split(':').map(Number);
    const scriptPath = path.join(__dirname, 'bazi.py');
    // Validate gender to prevent command injection
    const safeGender = ['male', 'female', 'unknown'].includes(gender) ? gender : 'unknown';
    const { spawnSync } = require('child_process');
    const result = spawnSync('python3', [scriptPath, String(year), String(month), String(day), String(hour), safeGender], {
      encoding: 'utf-8', timeout: 10000,
    });
    if (result.error) throw result.error;
    return JSON.parse(result.stdout);
  } catch (err) {
    console.error('BaZi calculation error:', err.message);
    return null;
  }
}
const PORT = 8066;

// 检查至少有一个 provider 配置了 API key
const { PROVIDERS } = require('./providers');
const hasAnyKey = Object.values(PROVIDERS).some(p => p.apiKey);
if (!hasAnyKey) {
  console.error('❌ No AI provider API key found. Configure at least one:');
  console.error('   export OPENAI_API_KEY=sk-...  (OpenAI)');
  console.error('   export DEEPSEEK_API_KEY=sk-...(DeepSeek)');
  console.error('   export DASHSCOPE_API_KEY=sk-...(Qwen)');
  process.exit(1);
}

// 静态文件服务
app.use(express.static(path.join(__dirname, '..')));
app.use(express.json());

// 用户认证 & 数据路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/stripe', require('./routes/stripe'));
app.use('/api/daily', require('./routes/daily'));
app.use('/api/hardware', require('./routes/hardware'));
app.use('/api/analytics', require('./routes/analytics'));

// CORS — restricted to configured origins
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:8066').split(',');
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const { callMify, getMifyModel } = require('./mify');
const { getAvailableProviders } = require('./providers');
const configStore = require('./config-store');

/**
 * 手动提取（JSON解析失败时的兜底）
 */
function extractManually(text) {
  const extract = (pattern) => {
    const m = text.match(pattern);
    return m ? m[1].trim() : '';
  };
  const extractArray = (pattern) => {
    const m = text.match(pattern);
    if (!m) return [];
    return m[1].split(/[,;]/).map(s => s.replace(/["'\[\]]/g, '').trim()).filter(Boolean);
  };

  return {
    soulKeywords: extractArray(/soulKeywords[^[]*\[([^\]]+)\]/i) || ['Unique', 'Complex', 'Deep', 'Mystical'],
    oneSentencePortrait: extract(/oneSentencePortrait['":\s]+["']?([^"'\n]+)/i) || text.slice(0, 200),
    coreTraits: [
      { trait: 'The Deep One', description: extract(/coreTraits[\s\S]*?description['":\s]+["']?([^"'\n]{20,})/i) || 'A complex soul with many layers.' }
    ],
    shadows: [
      { challenge: 'The Inner Tension', description: extract(/shadows[\s\S]*?description['":\s]+["']?([^"'\n]{20,})/i) || 'Every strength casts a shadow.' }
    ],
    lifeTheme: extract(/lifeTheme['":\s]+["']?([^"'\n]{20,})/i) || 'A journey of self-discovery and transformation.',
    dailyInsight: extract(/dailyInsight['":\s]+["']?([^"'\n]{10,})/i) || 'Today, pay attention to the signs around you.',
  };
}

/**
 * 健壮 JSON 解析（4 级降级）
 * Level 1: 直接解析
 * Level 2: 提取 {...} + 修复尾逗号
 * Level 3: 括号深度匹配 + 截断修复
 * Level 4: 手动正则提取
 */
function parseProfileJSON(raw) {
  // 预处理：去 markdown 代码块、BOM、控制字符
  const cleaned = raw
    .replace(/^```[\w]*\s*/gim, '')
    .replace(/```\s*$/gim, '')
    .replace(/^\s*[\uFEFF\u200B]+/g, '')
    .trim();

  // Level 1: 直接解析
  try { return JSON.parse(cleaned); } catch {}

  // Level 2: 提取 {...} + 修复
  try {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) {
      const fixed = m[0].replace(/,\s*([\]}])/g, '$1');
      return JSON.parse(fixed);
    }
  } catch {}

  // Level 3: 括号深度匹配 + 截断修复
  try {
    const start = cleaned.indexOf('{');
    if (start >= 0) {
      const partial = cleaned.slice(start);
      let depth = 0, end = 0;
      for (let i = 0; i < partial.length; i++) {
        if (partial[i] === '{') depth++;
        if (partial[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
      }
      if (end > 0) return JSON.parse(partial.slice(0, end));

      // 截断修复：移除不完整字段 + 补齐括号
      let t = partial
        // 移除末尾不完整的 key-value（值被截断或为空）
        .replace(/,?\s*"[^"]*":\s*"[^"]*$/, '')
        // 移除末尾不完整的数组值
        .replace(/,?\s*"[^"]*":\s*\[[^\]]*$/, '')
        // 移除末尾不完整的对象值
        .replace(/,?\s*"[^"]*":\s*\{[^}]*$/, '');
      // 补齐缺失的括号
      const ob = (t.match(/\{/g) || []).length, cb = (t.match(/\}/g) || []).length;
      const obr = (t.match(/\[/g) || []).length, cbr = (t.match(/\]/g) || []).length;
      for (let i = 0; i < obr - cbr; i++) t += ']';
      for (let i = 0; i < ob - cb; i++) t += '}';
      // 去除可能的尾逗号
      t = t.replace(/,\s*([\]}])/g, '$1');
      return JSON.parse(t);
    }
  } catch {}

  // Level 4: 手动正则提取
  console.warn('JSON parse failed, falling back to manual extraction');
  return extractManually(raw);
}

/**
 * API: 生成灵魂画像
 */
app.post('/api/generate-profile', optionalAuth, async (req, res) => {
  try {
    const { natalChart, mbtiType, ziweiChart, iching, lang, gender } = req.body;
    const outputLang = lang === 'zh' ? 'Chinese (中文)' : 'English';
    const genderHint = gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : gender === 'nonbinary' ? 'Non-binary' : 'Not specified';

    if (!natalChart || !mbtiType) {
      return res.status(400).json({ error: 'Missing natalChart or mbtiType' });
    }

    // 计算八字排盘
    const bazi = calculateBazi(
      req.body.birthDate || '1995-06-15',
      req.body.birthTime || '12:00',
      gender
    );

    const systemPrompt = `You are SOUL COSMOS — a master personality analyst who synthesizes insights from Western Astrology, Eastern Zi Wei Dou Shu (紫微斗数), BaZi (八字命理), I Ching (易经), MBTI personality typing, and Social Psychology.

CRITICAL: You MUST respond entirely in ${outputLang}. All field values (soulKeywords, oneSentencePortrait, coreTraits, shadows, lifeTheme, dailyInsight) must be in ${outputLang}.

Your writing style:
- Warm but precise, like a wise friend who truly sees you
- Use specific astrological/placement details, never generic
- Blend Eastern and Western metaphors naturally
- Avoid fortune-cookie language or Barnum effect statements
- Be honest about shadows, not just flattering
- ALL OUTPUT MUST BE IN ${outputLang} — every word, every field, no exceptions

You MUST respond with valid JSON. IMPORTANT: Keep reasoningSteps concise (1 sentence per reasoning field). Keep all text fields brief but specific.

{
  "reasoningSteps": [
    {"system": "BaZi (八字)", "icon": "📜", "input": "四柱: XX XX XX XX", "reasoning": "One concise sentence about the BaZi reading", "conclusion": "Key insight"},
    {"system": "Western Astrology", "icon": "🌌", "input": "Sun/Moon/Rising", "reasoning": "One sentence on how signs interact", "conclusion": "Archetype"},
    {"system": "Zi Wei Dou Shu", "icon": "☯", "input": "Main Star", "reasoning": "One sentence on star meaning", "conclusion": "Pattern"},
    {"system": "I Ching", "icon": "☯️", "input": "Hexagram", "reasoning": "One sentence on hexagram energy", "conclusion": "Guidance"},
    {"system": "MBTI", "icon": "🧠", "input": "Type", "reasoning": "One sentence on cognitive functions", "conclusion": "Style"},
    {"system": "Fusion", "icon": "✦", "input": "Cross-validation", "reasoning": "One sentence on convergence", "conclusion": "Final archetype"}
  ],
  "soulKeywords": ["keyword1", "keyword2", "keyword3", "keyword4"],
  "oneSentencePortrait": "A poetic sentence referencing 2+ systems",
  "coreTraits": [
    {"trait": "Name", "description": "2-3 sentences with specific references"}
  ],
  "shadows": [
    {"challenge": "Name", "description": "2 sentences with element references"}
  ],
  "lifeTheme": "2-3 sentences on the overarching life narrative",
  "lifePhases": {
    "early": "1-2 sentences on early life",
    "middle": "1-2 sentences on mid life",
    "later": "1-2 sentences on later life"
  },
  "strengthsAndWarnings": {
    "strengths": ["strength1", "strength2", "strength3"],
    "warnings": ["warning1", "warning2"]
  },
  "selfImprovement": "2-3 sentences of practical advice",
  "dailyInsight": "2 sentences, personalized for today",
  "marriageFortune": "2-3 sentences on marriage/romance",
  "careerGuidance": "2-3 sentences on career path",
  "healthAdvice": "2 sentences on health based on five elements",
  "annualFortune": "2 sentences on this year's trend",
  "futureDestiny": "2-3 sentences on life trajectory",
  "childrenFortune": "2 sentences on children fortune",
  "relationshipStyle": "2 sentences on love/friendship style",
  "luckyElements": {
    "colors": ["color1", "color2"],
    "numbers": ["number1", "number2"],
    "direction": "best direction",
    "day": "luckiest day of week"
  },
  "compatibilityTip": "2-3 sentences about ideal partner characteristics — reference both BaZi zodiac compatibility and MBTI pairing"
}

IMPORTANT: Output ONLY the JSON object. No markdown, no explanation, no code blocks.`;

    const userPrompt = `Generate a soul profile for this person:

GENDER: ${genderHint}

WESTERN NATAL CHART:
- Sun: ${natalChart.sun.name} (${natalChart.sun.element}, ${natalChart.sun.quality})
- Moon: ${natalChart.moon.name} (${natalChart.moon.element})
- Rising/Ascendant: ${natalChart.rising.name} (${natalChart.rising.element})
- Dominant Element: ${natalChart.dominantElement}

MBTI TYPE: ${mbtiType}

${bazi ? `BAZI (八字命理): ${bazi.fourPillars} | 日主: ${bazi.riZhu}(${bazi.riZhuWuXing},${bazi.riZhuYinYang}) | 格局: ${bazi.geJu} | 主导: ${bazi.wuXing.dominant} | 缺: ${bazi.wuXing.lack || '无'} | 特质: ${bazi.riZhuTrait}` : ''}

ZI WEI DOU SHU (紫微斗数):
- Main Star: ${ziweiChart.mainStar}
- Life Palace: ${ziweiChart.lifePalace}
- Career Palace: ${ziweiChart.careerPalace}

${iching ? `I CHING (易经) HEXAGRAM:
- Hexagram: ${iching.number}. ${iching.name} (${iching.english}) ${iching.symbol}
- Upper Trigram: ${iching.upperTrigram?.name || ''} (${iching.upperTrigram?.english || ''})
- Lower Trigram: ${iching.lowerTrigram?.name || ''} (${iching.lowerTrigram?.english || ''})
- Judgment: ${iching.judgmentEn}
- Image: ${iching.imageEn}
- Keywords: ${iching.keywords?.join(', ') || ''}
- Personality: ${iching.personality || ''}` : ''}

Create a deeply personal, specific soul portrait. Fuse ALL systems into ONE coherent description — do NOT list each system separately. Make the person feel "this is SO me."
${req.user ? kepa.getFusionStrategy(req.user.id) : ''}`;

    const rawResponse = await callMify([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], 4000);

    // 解析 JSON（健壮版 — 4 级降级）
    let profile = parseProfileJSON(rawResponse);

    // 补全缺失字段的默认值
    const isZh = lang === 'zh';
    if (!profile.reasoningSteps || !profile.reasoningSteps.length) {
      profile.reasoningSteps = [
        { system: isZh ? '西方星盘' : 'Western Astrology', icon: '🌌', input: `Sun ${natalChart.sun.name}, Moon ${natalChart.moon.name}, Rising ${natalChart.rising.name}`, reasoning: isZh ? `${natalChart.sun.name}太阳赋予${natalChart.sun.element}元素的核心驱动力。${natalChart.moon.name}月亮带来情感深度。${natalChart.rising.name}上升塑造外在表现。` : `${natalChart.sun.name} Sun provides ${natalChart.sun.element} core drive. ${natalChart.moon.name} Moon adds emotional depth. ${natalChart.rising.name} Rising shapes outer presentation.`, conclusion: isZh ? `核心原型：${natalChart.sun.element}元素主导的${natalChart.sun.name}灵魂` : `Core archetype: ${natalChart.sun.element}-dominated ${natalChart.sun.name} soul` },
        { system: isZh ? '八字命理' : 'BaZi (Four Pillars)', icon: '📜', input: bazi ? bazi.fourPillars : 'N/A', reasoning: bazi ? (isZh ? `日主${bazi.riZhu}（${bazi.riZhuWuXing}，${bazi.riZhuYinYang}），${bazi.riZhuTrait}。格局${bazi.geJu}。主导五行${bazi.wuXing.dominant}，最弱${bazi.wuXing.weakest}。` : `Day Master ${bazi.riZhu} (${bazi.riZhuWuXing}, ${bazi.riZhuYinYang}). Pattern: ${bazi.geJu}. Dominant: ${bazi.wuXing.dominant}, Weakest: ${bazi.wuXing.weakest}.`) : (isZh ? '八字数据未获取' : 'BaZi data not available'), conclusion: bazi ? (isZh ? `先天格局：${bazi.geJu}，${bazi.wuXing.lack ? '五行缺' + bazi.wuXing.lack : '五行均衡'}` : `Innate pattern: ${bazi.geJu}`) : '' },
        { system: isZh ? '紫微斗数' : 'Zi Wei Dou Shu', icon: '☯', input: `Main Star: ${ziweiChart.mainStar}`, reasoning: isZh ? `${ziweiChart.mainStar}星落入${ziweiChart.lifePalace}，揭示先天格局与人生主题。` : `${ziweiChart.mainStar} star in ${ziweiChart.lifePalace} reveals innate life pattern and themes.`, conclusion: isZh ? `命理格局：${ziweiChart.mainStar}主导` : `Destiny pattern: ${ziweiChart.mainStar} dominant` },
        { system: isZh ? '易经' : 'I Ching', icon: '☯️', input: `${iching?.number || 1}. ${iching?.name || '乾'}`, reasoning: isZh ? (iching?.judgment || '元亨利贞。') : (iching?.judgmentEn || 'Sublime success.'), conclusion: isZh ? `生命能量：${iching?.keywords?.join('、') || '创造、领导'}` : `Life energy: ${iching?.keywords?.join(', ') || 'Creative, Leadership'}` },
        { system: 'MBTI', icon: '🧠', input: mbtiType, reasoning: isZh ? `${mbtiType}型人格的认知功能栈决定了信息处理和决策偏好。` : `The ${mbtiType} cognitive function stack determines information processing and decision preferences.`, conclusion: isZh ? `决策风格：${mbtiType[0] === 'I' ? '内向直觉' : '外向感觉'}主导` : `Decision style: ${mbtiType[0] === 'I' ? 'Introverted intuition' : 'Extraverted sensing'} dominant` },
        { system: isZh ? '融合' : 'Fusion', icon: '✦', input: isZh ? '所有体系交叉验证' : 'Cross-validation of all systems', reasoning: isZh ? '东方命理（八字+紫微）+ 西方心理学（星盘+MBTI）+ 古老智慧（易经）六维交叉验证，得出统一画像。' : 'Eastern destiny (BaZi+Zi Wei) + Western psychology (Astrology+MBTI) + Ancient wisdom (I Ching) cross-validated into unified portrait.', conclusion: isZh ? `最终画像：${profile.soulKeywords?.join(' · ')}` : `Final portrait: ${profile.soulKeywords?.join(' · ')}` },
      ];
    }
    // 附加八字数据到响应
    profile.bazi = bazi;

    // 补全核心字段（AI可能返回空值）
    const signMapZh = { 'Aries': '白羊', 'Taurus': '金牛', 'Gemini': '双子', 'Cancer': '巨蟹', 'Leo': '狮子', 'Virgo': '处女', 'Libra': '天秤', 'Scorpio': '天蝎', 'Sagittarius': '射手', 'Capricorn': '摩羯', 'Aquarius': '水瓶', 'Pisces': '双鱼' };
    const sunZh = signMapZh[natalChart.sun.name] || natalChart.sun.name;
    const moonZh = signMapZh[natalChart.moon.name] || natalChart.moon.name;
    const risingZh = signMapZh[natalChart.rising.name] || natalChart.rising.name;

    if (!profile.soulKeywords || !profile.soulKeywords.length) {
      const wx = bazi?.riZhuWuXing || natalChart.sun.element;
      const wxMapZh = { '木': '生长', '火': '热情', '土': '稳重', '金': '精准', '水': '智慧' };
      const wxMapEn = { '木': 'Growth', '火': 'Passion', '土': 'Stability', '金': 'Precision', '水': 'Wisdom' };
      profile.soulKeywords = isZh
        ? [sunZh + '之魂', wxMapZh[wx] || '深邃', ziweiChart.mainStar + '之力', mbtiType + '思维']
        : [natalChart.sun.name + ' Soul', wxMapEn[wx] || 'Depth', ziweiChart.mainStar + ' Power', mbtiType + ' Mind'];
    }
    if (!profile.oneSentencePortrait) {
      profile.oneSentencePortrait = isZh
        ? `你是${sunZh}太阳${moonZh}月亮${risingZh}上升的灵魂，${bazi?.riZhuTrait || ''}，${mbtiType}型人格赋予你独特的思维方式。`
        : `You are a ${natalChart.sun.name} Sun with ${natalChart.moon.name} Moon and ${natalChart.rising.name} Rising — ${bazi?.riZhuTrait || 'a complex soul'} with the ${mbtiType} mind.`;
    }
    if (!profile.coreTraits || !profile.coreTraits.length) {
      profile.coreTraits = [
        { trait: isZh ? '核心驱动力' : 'Core Drive', description: isZh ? `${natalChart.sun.name}太阳赋予${natalChart.sun.element}元素的生命能量。` : `Your ${natalChart.sun.name} sun grants ${natalChart.sun.element} life force.` },
        { trait: isZh ? '情感模式' : 'Emotional Pattern', description: isZh ? `${natalChart.moon.name}月亮带来${natalChart.moon.element}元素的情感深度。` : `Your ${natalChart.moon.name} moon brings ${natalChart.moon.element} emotional depth.` },
      ];
    }
    if (!profile.shadows || !profile.shadows.length) {
      profile.shadows = [
        { challenge: isZh ? '内在张力' : 'Inner Tension', description: isZh ? `${natalChart.moon.name}月亮的情感需求与${natalChart.rising.name}上升的外在表现之间存在张力。` : `Tension between your ${natalChart.moon.name} moon needs and ${natalChart.rising.name} rising exterior.` },
      ];
    }
    if (!profile.lifeTheme) {
      profile.lifeTheme = isZh ? `你的人生是一场${natalChart.sun.element}元素驱动的自我探索之旅。` : `Your life is a ${natalChart.sun.element}-driven journey of self-discovery.`;
    }
    if (!profile.dailyInsight) {
      profile.dailyInsight = isZh ? `今天，关注你的${natalChart.moon.name}月亮能量，它正在引导你。` : `Today, listen to your ${natalChart.moon.name} moon energy — it is guiding you.`;
    }

    profile.marriageFortune = profile.marriageFortune || (isZh ? `${sunZh}座的你在感情中追求深度连接。${bazi?.riZhuWuXing || ''}元素主导的你，倾向于用行动表达爱意。最佳婚恋时机与你的大运流年密切相关。` : `As a ${natalChart.sun.name}, you seek deep emotional connections in love. Your ${bazi?.riZhuWuXing || ''}-dominant nature expresses love through actions. Best timing for relationships aligns with your life cycles.`);
    profile.careerGuidance = profile.careerGuidance || (isZh ? '你的星盘显示你适合需要创造力和洞察力的工作。在团队中，你更倾向于深度思考而非表面执行。' : 'Your chart suggests you thrive in roles requiring creativity and insight. In teams, you prefer deep thinking over surface-level execution.');
    profile.healthAdvice = profile.healthAdvice || (isZh ? `你的${bazi?.riZhuWuXing || ''}元素主导体质，需要注意${bazi?.wuXing?.weakest || ''}元素相关的健康问题。建议保持规律作息，适当运动。` : `Your ${bazi?.riZhuWuXing || ''}-dominant constitution suggests paying attention to ${bazi?.wuXing?.weakest || ''}-related health areas. Regular sleep and exercise are recommended.`);
    profile.annualFortune = profile.annualFortune || (isZh ? '今年整体运势平稳向好，适合在事业上稳步推进。注意人际关系的维护，下半年有不错的机遇。' : 'This year trends steady and positive. Good for steady career progress. Watch relationships; opportunities arise in the second half.');
    profile.futureDestiny = profile.futureDestiny || (isZh ? `你的人生轨迹呈现逐步上升的趋势。${bazi?.geJu || ''}格局赋予你稳步发展的潜力，中年后迎来收获期。` : `Your life trajectory shows gradual upward movement. Your ${bazi?.geJu || ''} pattern grants steady development potential, with rewards coming in mid-life.`);
    profile.childrenFortune = profile.childrenFortune || (isZh ? `${bazi?.riZhuWuXing || ''}元素日主的你，与子女的缘分深厚。你倾向于给予孩子自由探索的空间，同时保持温暖的引导。` : `As a ${bazi?.riZhuWuXing || ''} Day Master, you have deep bonds with children. You tend to give kids freedom to explore while maintaining warm guidance.`);
    profile.relationshipStyle = profile.relationshipStyle || (isZh ? '你在关系中追求深度连接而非表面社交。你倾向于用行动而非言语表达爱意。' : 'You seek deep connections over surface-level socializing. You tend to express love through actions rather than words.');

    // 人生阶段分析
    profile.lifePhases = profile.lifePhases || {
      early: isZh ? `早年（0-30岁）：${natalChart.sun.element}元素主导的你，早年经历较多变动和挑战。这段时间是性格塑造期，虽然辛苦但为未来打下坚实基础。` : `Early life (0-30): Your ${natalChart.sun.element}-dominant nature brings many changes and challenges in early years. This period shapes your character — tough but foundational.`,
      middle: isZh ? `中年（30-50岁）：运势逐渐上升，贵人出现，事业进入收获期。${bazi?.geJu || ''}格局的能量在此时充分释放。` : `Mid-life (30-50): Fortune rises, mentors appear, career enters harvest period. Your ${bazi?.geJu || ''} pattern fully activates.`,
      later: isZh ? `晚年（50岁以后）：越老越有福，生活安稳，子女孝顺，享受前半生奋斗的成果。` : `Later life (50+): Growing fortune, stability, and enjoying the fruits of earlier efforts.`,
    };

    // 优势与提醒
    profile.strengthsAndWarnings = profile.strengthsAndWarnings || {
      strengths: isZh
        ? [`${bazi?.riZhu || ''}日主赋予你独特的生命能量：${bazi?.riZhuTrait || ''}`, `${natalChart.sun.element}元素带来${natalChart.sun.element === '火' ? '热情与感染力' : natalChart.sun.element === '土' ? '稳重与可靠性' : natalChart.sun.element === '金' ? '决断力与精准' : natalChart.sun.element === '水' ? '智慧与适应力' : '创造力与成长力'}`, `${mbtiType}型人格的${mbtiType[2] === 'T' ? '理性分析' : '共情理解'}能力是你的核心竞争力`]
        : [`${bazi?.riZhu || ''} Day Master grants you unique life energy`, `${natalChart.sun.element} element brings ${natalChart.sun.element === 'Fire' ? 'passion and charisma' : natalChart.sun.element === 'Earth' ? 'stability and reliability' : natalChart.sun.element === 'Metal' ? 'decisiveness and precision' : natalChart.sun.element === 'Water' ? 'wisdom and adaptability' : 'creativity and growth'}`, `Your ${mbtiType} personality's ${mbtiType[2] === 'T' ? 'analytical' : 'empathetic'} strength is your core competitive advantage`],
      warnings: isZh
        ? [`命局${bazi?.wuXing?.lack ? '缺' + bazi.wuXing.lack : '五行偏弱'}，需要注意${bazi?.wuXing?.lack === '金' ? '理性思维、边界感、理财能力' : bazi?.wuXing?.lack === '木' ? '成长规划、创造力、决断力' : bazi?.wuXing?.lack === '火' ? '热情、表达力、社交能量' : bazi?.wuXing?.lack === '土' ? '稳定性、耐心、落地执行' : '灵活性、情感表达、适应能力'}的培养`, `${natalChart.moon.name}月亮带来的情绪敏感需要学会管理，避免过度内耗`]
        : [`Your chart ${bazi?.wuXing?.lack ? 'lacks ' + bazi.wuXing.lack : 'has weak elements'} — cultivate ${bazi?.wuXing?.lack === 'Metal' ? 'rational thinking, boundaries, financial discipline' : bazi?.wuXing?.lack === 'Wood' ? 'growth planning, creativity, decisiveness' : bazi?.wuXing?.lack === 'Fire' ? 'passion, expression, social energy' : bazi?.wuXing?.lack === 'Earth' ? 'stability, patience, execution' : 'flexibility, emotional expression, adaptability'}`, `Your ${natalChart.moon.name} moon's emotional sensitivity needs management to avoid burnout`],
    };

    // 自我成长建议
    const lackMap = { '金': '理性思维、理财、规则感', '木': '成长规划、创造力、决断力', '火': '热情表达、社交能量、自信', '土': '稳定性、耐心、落地执行', '水': '灵活性、情感表达、适应力' };
    profile.selfImprovement = profile.selfImprovement || (isZh
      ? `你的命局${bazi?.wuXing?.lack ? '缺' + bazi.wuXing.lack : '五行有偏'}，建议多接触${lackMap[bazi?.wuXing?.lack] || '平衡各方面'}的环境和人群。${natalChart.moon.element === '水' ? '情绪管理是你的终身课题——学会表达而非压抑。' : '保持内心的平衡，避免过度投入某一方面。'}建立边界感、学会说"不"，是你最重要的成长方向。`
      : `Your chart ${bazi?.wuXing?.lack ? 'lacks ' + bazi.wuXing.lack : 'has imbalanced elements'}. Seek environments that strengthen these areas. ${natalChart.moon.element === 'Water' ? 'Emotional management is your lifelong lesson — learn to express, not suppress.' : 'Maintain inner balance and avoid over-investing in any one area.'} Building boundaries and learning to say "no" is your most important growth direction.`);
    profile.luckyElements = profile.luckyElements || {
      colors: isZh ? ['深蓝', '紫色'] : ['Deep Blue', 'Purple'],
      numbers: isZh ? ['7', '3'] : ['7', '3'],
      direction: isZh ? '北方' : 'North',
      day: isZh ? '周二' : 'Tuesday',
    };
    profile.compatibilityTip = profile.compatibilityTip || (isZh ? '你最适合与能理解你内心深度、同时给你足够空间的人相处。' : 'You are best matched with someone who understands your inner depth while giving you enough personal space.');

    // 最终安全检查：确保 profile 是有效对象
    if (typeof profile !== 'object' || profile === null || Array.isArray(profile)) {
      console.error('Profile is not a valid object, using extractManually');
      profile = extractManually(rawResponse || '');
    }

    res.json({ success: true, profile, model: getMifyModel() });
  } catch (err) {
    console.error('Generate profile error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * API: Multi-Agent Harness — 两阶段返回
 * 阶段 1 (即时): 本地分析 reasoningSteps (0ms)
 * 阶段 2 (异步): AI 融合 profile (/api/fusion/:requestId)
 */
const fusionCache = new Map(); // requestId → { status, profile }

// 缓存清理（每 10 分钟清理过期条目）
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of fusionCache) {
    if (key.startsWith('cache_')) continue; // 持久缓存不清理
    if (val.createdAt && now - val.createdAt > 300000) fusionCache.delete(key); // 5 分钟过期
  }
}, 600000);

app.post('/api/harness-profile', optionalAuth, async (req, res) => {
  try {
    const { natalChart, mbtiType, ziweiChart, iching, lang, gender, birthDate, birthTime } = req.body;
    const bazi = calculateBazi(birthDate, birthTime, gender);
    const input = { natalChart, mbtiType, ziweiChart, iching, bazi, lang, gender, birthDate };

    // Phase 1: 本地分析（即时返回）
    const { generateLocalAnalysis } = require('./local-analysis');
    const reasoningSteps = generateLocalAnalysis(input);

    // 检查缓存（相同输入直接返回完整结果）
    const cacheKey = `${birthDate}_${birthTime}_${mbtiType}_${natalChart?.sun?.name}_${ziweiChart?.mainStar}_${lang}`;
    const cached = fusionCache.get('cache_' + cacheKey);
    if (cached && cached.status === 'ready') {
      return res.json({
        success: true, mode: 'fast', requestId: null,
        reasoningSteps, bazi, cached: true, profile: cached.profile,
      });
    }

    const requestId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    // Phase 2: 异步 AI 融合
    fusionCache.set(requestId, { status: 'loading', profile: null });
    const agentSummaries = reasoningSteps.map(s => `[${s.system}] ${s.reasoning}`).join('\n');
    const L = lang === 'zh' ? 'Chinese' : 'English';

    const isZh = lang === 'zh';
    const fusionPrompt = isZh
      ? `你是一个人格分析师。将以下多维分析融合成一个灵魂画像。
重要：所有字段必须用中文输出。不要用英文。
只输出JSON，不要其他内容：
{"soulKeywords":["关键词1","关键词2","关键词3","关键词4"],"oneSentencePortrait":"诗意的一句话画像","coreTraits":[{"trait":"特质名","description":"2句话描述"}],"shadows":[{"challenge":"挑战名","description":"2句话描述"}],"lifeTheme":"2句话人生主题","dailyInsight":"2句话每日洞察","marriageFortune":"2句话感情运","careerGuidance":"2句话事业运","healthAdvice":"2句话健康建议","annualFortune":"2句话年度运势","luckyElements":{"colors":["颜色1","颜色2"],"numbers":[1,2],"direction":"方位","day":"星期几"}}`
      : `You are a personality analyst. Fuse these analyses into a soul portrait.
Reply in English. Keep each field 1-2 sentences. Output ONLY valid JSON:
{"soulKeywords":["k1","k2","k3","k4"],"oneSentencePortrait":"poetic","coreTraits":[{"trait":"Name","description":"2 sentences"}],"shadows":[{"challenge":"Name","description":"2 sentences"}],"lifeTheme":"2 sentences","dailyInsight":"2 sentences","marriageFortune":"2 sentences","careerGuidance":"2 sentences","healthAdvice":"2 sentences","annualFortune":"2 sentences","luckyElements":{"colors":[],"numbers":[],"direction":"","day":""}}`;

    callMify([
      { role: 'system', content: fusionPrompt },
      { role: 'user', content: `Analyses:\n${agentSummaries}\n\nFuse into one soul portrait.` },
    ], 4000).then(raw => {
      const profile = parseFusionJSON(raw);
      fusionCache.set(requestId, { status: 'ready', profile });
      // 缓存结果（相同输入直接返回）
      if (profile) fusionCache.set('cache_' + cacheKey, { status: 'ready', profile });
    }).catch(err => {
      console.warn('Fusion failed:', err.message);
      fusionCache.set(requestId, { status: 'failed', profile: null });
    });

    // 立即返回本地结果 + requestId
    res.json({
      success: true,
      mode: 'fast',
      requestId,
      reasoningSteps,
      bazi,
      model: 'xiaomi/mimo-v2.5-pro',
    });
  } catch (err) {
    console.error('Harness error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * API: 轮询 AI 融合结果
 */
app.get('/api/fusion/:requestId', (req, res) => {
  const result = fusionCache.get(req.params.requestId);
  if (!result) return res.json({ status: 'not_found' });
  if (result.status === 'ready') fusionCache.delete(req.params.requestId); // 清理
  res.json(result);
});

/**
 * JSON 解析（融合结果）
 */
function parseFusionJSON(raw) {
  const cleaned = raw.replace(/^```[\w]*\s*/gim, '').replace(/```\s*$/gim, '').trim();
  try { return JSON.parse(cleaned); } catch {}
  try { const m = cleaned.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0].replace(/,\s*([\]}])/g, '$1')); } catch {}
  try {
    const start = cleaned.indexOf('{');
    if (start >= 0) {
      let t = cleaned.slice(start).replace(/,?\s*"[^"]*":\s*"[^"]*$/, '').replace(/,?\s*"[^"]*":\s*\[[^\]]*$/, '');
      const ob=(t.match(/\{/g)||[]).length, cb=(t.match(/\}/g)||[]).length;
      const obr=(t.match(/\[/g)||[]).length, cbr=(t.match(/\]/g)||[]).length;
      for(let i=0;i<obr-cbr;i++) t+=']';
      for(let i=0;i<ob-cb;i++) t+='}';
      return JSON.parse(t.replace(/,\s*([\]}])/g,'$1'));
    }
  } catch {}
  return null;
}

/**
 * API: 生成每日洞察
 */
app.post('/api/daily-insight', async (req, res) => {
  try {
    const { soulKeywords, portrait, sunSign, moonSign, mbtiType, lang } = req.body;
    const L = lang === 'zh' ? 'Chinese (中文)' : 'English';

    const systemPrompt = `You are writing a daily insight for a specific person based on their unique soul profile.
Style: Like Co-Star but warmer and more insightful. Short, punchy, personal. Use emoji sparingly.
Format: One paragraph, 2-3 sentences max. Start with an action or observation, not a greeting.
Today's date: ${new Date().toISOString().slice(0, 10)}
ALL OUTPUT MUST BE IN ${L}. Every word, no exceptions.`;

    const userPrompt = `Soul Keywords: ${soulKeywords?.join(', ')}
Portrait: ${portrait}
Sun: ${sunSign}, Moon: ${moonSign}, MBTI: ${mbtiType}

Write today's personalized insight. Make it feel like you're reading their mind. Be specific to their profile, not generic.`;

    const insight = await callMify([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], 300);

    res.json({ success: true, insight, model: getMifyModel() });
  } catch (err) {
    console.error('Daily insight error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * API: 关系匹配
 */
app.post('/api/compatibility', async (req, res) => {
  try {
    const { profileA, profileB, lang } = req.body;
    const L = lang === 'zh' ? 'Chinese (中文)' : 'English';

    const systemPrompt = `You are analyzing the compatibility between two people based on their combined natal charts and MBTI types.
ALL OUTPUT MUST BE IN ${L}. Be specific and insightful.
Respond with valid JSON:
{
  "score": 0-100,
  "description": "One sentence relationship description",
  "strengths": ["strength1", "strength2", "strength3"],
  "challenges": ["challenge1", "challenge2"],
  "advice": "One piece of specific advice"
}
Output ONLY the JSON.`;

    const userPrompt = `Person A: ${profileA.sun} Sun, ${profileA.moon} Moon, ${profileA.rising} Rising, ${profileA.mbti}
Person B: ${profileB.sun} Sun, ${profileB.moon} Moon, ${profileB.rising} Rising, ${profileB.mbti}

Analyze their compatibility.`;

    const rawResponse = await callMify([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], 800);

    let compatibility;
    try {
      compatibility = JSON.parse(rawResponse);
    } catch {
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      compatibility = jsonMatch ? JSON.parse(jsonMatch[0]) : { score: 50, description: rawResponse };
    }

    res.json({ success: true, compatibility, model: getMifyModel() });
  } catch (err) {
    console.error('Compatibility error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * API: 周度关系预测
 */
app.post('/api/weekly-forecast', async (req, res) => {
  try {
    const { myProfile, people, lang } = req.body;
    const L = lang === 'zh' ? 'Chinese (中文)' : 'English';
    if (!people?.length) return res.json({ forecasts: [] });

    const peopleList = people.map((p, i) =>
      `${i + 1}. ${p.name} (${p.relation}): ${p.sun} Sun, ${p.mbti} MBTI`
    ).join('\n');

    const systemPrompt = `You are a relationship intelligence advisor combining Western astrology, Eastern philosophy, and social psychology.
ALL OUTPUT MUST BE IN ${L}. Be practical, specific, and slightly humorous — like a wise friend giving real advice.
Today is ${new Date().toISOString().slice(0, 10)}.

Respond with valid JSON:
{
  "forecasts": [
    {
      "name": "person name",
      "score": 0-100,
      "advice": "2-3 sentences of practical weekly advice, specific to this relationship type"
    }
  ]
}
Output ONLY the JSON. One forecast per person, in the same order.`;

    const userPrompt = `My profile: ${myProfile.sun} Sun, ${myProfile.moon} Moon, ${myProfile.rising} Rising, ${myProfile.mbti} MBTI

People in my circle:
${peopleList}

Generate this week's relationship forecast for each person. Be specific about:
- Boss: Will they be in a good mood? Should I approach them about something? Watch out for?
- Colleague: Collaboration opportunities? Tensions?
- Partner: Emotional energy this week? Date night ideas?
- Friend: Reach out or give space?
- Client: Good time to pitch? Be cautious?

Make it feel like you actually know these people.`;

    const rawResponse = await callMify([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], 2000);

    let result;
    try {
      result = JSON.parse(rawResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim());
    } catch {
      const match = rawResponse.match(/\{[\s\S]*\}/);
      result = match ? JSON.parse(match[0]) : { forecasts: people.map(p => ({ name: p.name, score: 50, advice: 'Stay balanced this week.' })) };
    }

    res.json({ success: true, forecasts: result.forecasts || [], model: getMifyModel() });
  } catch (err) {
    console.error('Weekly forecast error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * API: 风水分析
 */
app.post('/api/fengshui', async (req, res) => {
  try {
    const params = req.body;
    const userElement = params.userProfile?.element || 'Unknown';
    const L = params.lang === 'zh' ? 'Chinese (中文)' : 'English';

    const systemPrompt = `You are a Feng Shui master with deep knowledge of Chinese metaphysics, combined with modern interior design sensibility.
ALL OUTPUT MUST BE IN ${L}. Be practical — give advice people can actually follow without renovating their home.
Consider the user's birth element (${userElement}) for personalized recommendations.

Respond with valid JSON:
{
  "score": 0-100,
  "overall": "2-3 sentence overall assessment",
  "tips": ["tip1", "tip2", "tip3", "tip4", "tip5"],
  "warnings": ["warning1", "warning2"],
  "luckyElements": "What elements/colors/directions are lucky for this person based on their birth element"
}
Output ONLY the JSON.`;

    let userPrompt = '';

    if (params.type === 'home') {
      userPrompt = `Analyze this home's Feng Shui:

- Building faces: ${params.direction}
- Front door faces: ${params.doorDirection}
- Bedroom location: ${params.bedroomLocation}
- Bed position: ${params.bedPosition}
${params.concerns ? `- Concerns: ${params.concerns}` : ''}

User's birth element: ${userElement}
User's MBTI: ${params.userProfile?.mbti || 'Unknown'}

Give practical Feng Shui recommendations. Consider:
1. Qi flow from door through the home
2. Bedroom positioning for health and relationships
3. Bed direction for better sleep
4. Element balance based on user's birth element
5. Any specific concerns they mentioned`;
    } else {
      userPrompt = `Analyze this office/desk Feng Shui:

- Desk faces: ${params.deskDirection}
- Desk position: ${params.deskPosition}
- Office floor: ${params.floor}
${params.careerGoal ? `- Career goal: ${params.careerGoal}` : ''}

User's birth element: ${userElement}
User's MBTI: ${params.userProfile?.mbti || 'Unknown'}

Give practical office Feng Shui recommendations. Consider:
1. Desk facing direction for career luck
2. Position relative to door (command position)
3. What to place on desk for career success
4. Floor level energy implications
5. How to activate career luck based on their goal`;
    }

    const rawResponse = await callMify([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], 1500);

    let result;
    try {
      result = JSON.parse(rawResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim());
    } catch {
      const match = rawResponse.match(/\{[\s\S]*\}/);
      if (match) {
        try { result = JSON.parse(match[0]); } catch { result = null; }
      }
      if (!result || !result.tips?.length) {
        // 手动提取
        const tips = [];
        const tipMatches = rawResponse.match(/(?:tip|recommend|建议)[:\s]*["']?([^"'\n]{10,})/gi);
        if (tipMatches) tipMatches.forEach(t => tips.push(t.replace(/^.*?[:\s]*/i, '').trim()));
        result = {
          score: result?.score || 65,
          overall: result?.overall || rawResponse.slice(0, 300),
          tips: tips.length ? tips.slice(0, 5) : ['Declutter your entrance for better Qi flow', 'Keep bedroom clean and calm for restful sleep', 'Add plants for Wood element energy'],
          warnings: result?.warnings || [],
          luckyElements: result?.luckyElements || 'Based on your Water element, blue and black tones support your energy.',
        };
      }
    }

    res.json({ success: true, fengshui: result, model: getMifyModel() });
  } catch (err) {
    console.error('Feng shui error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * API: 面相/手相分析
 */
app.post('/api/photo-analysis', async (req, res) => {
  try {
    const { type, userProfile, lang } = req.body;
    const L = lang === 'zh' ? 'Chinese (中文)' : 'English';
    const memoryContext = getMemoryContext();

    const systemPrompt = `You are a ${type === 'face' ? 'face reading (面相)' : 'palm reading (手相)'} master combining Chinese physiognomy with modern psychology.
ALL OUTPUT MUST BE IN ${L}. Be specific and insightful.
${memoryContext}

Respond with valid JSON:
{
  "summary": "2-3 sentence overall reading",
  "traits": [
    {"name": "Feature Name", "description": "What this feature reveals about the person"}
  ],
  "advice": "One actionable piece of advice based on the reading"
}
Output ONLY the JSON.`;

    const userPrompt = `Analyze this person's ${type} based on their profile:
- Sun: ${userProfile?.sun || 'Unknown'}, Element: ${userProfile?.element || 'Unknown'}
- MBTI: ${userProfile?.mbti || 'Unknown'}

Note: No photo was actually uploaded (demo mode). Generate a ${type} reading based on their astrological/psychological profile, as if you had seen their ${type}.
Make it feel personal and specific to their profile.`;

    const rawResponse = await callMify([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], 1200);

    let result;
    try {
      result = JSON.parse(rawResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim());
    } catch {
      const match = rawResponse.match(/\{[\s\S]*\}/);
      result = match ? JSON.parse(match[0]) : { summary: rawResponse.slice(0, 300), traits: [], advice: '' };
    }

    res.json({ success: true, analysis: result, model: getMifyModel() });
  } catch (err) {
    console.error('Photo analysis error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * API: 周度场景建议（两阶段：本地即时 + AI 异步增强）
 */
app.post('/api/scenes', optionalAuth, async (req, res) => {
  try {
    const { userProfile, lang } = req.body;
    const { generateLocalScenes } = require('./scenes');

    // Phase 1: 本地生成（0ms）
    const localResult = generateLocalScenes(userProfile, lang);

    // 检查本周缓存
    const weekKey = `scenes_${new Date().toISOString().slice(0, 10)}_${userProfile?.element}_${userProfile?.mbti}`;
    const cached = fusionCache.get(weekKey);
    if (cached) {
      return res.json({ success: true, ...localResult, aiScenes: cached, cached: true });
    }

    // Phase 2: 异步 AI 增强
    const requestId = 'sc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    fusionCache.set(requestId, { status: 'loading', profile: null });

    const L = lang === 'zh' ? 'Chinese' : 'English';
    const systemPrompt = `You are a life scene advisor. Generate 4 weekly scene cards.
Reply in ${L}. Keep each card concise (2-3 sentences body, 1 sentence advice).
Output ONLY valid JSON:
{"scenes":[{"icon":"💼","title":"Title","body":"2-3 sentences","advice":"1 sentence"}]}`;

    callMify([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `User: ${userProfile?.sun||''} Sun, ${userProfile?.moon||''} Moon, ${userProfile?.mbti||''} MBTI, ${userProfile?.element||''} element. Generate workplace, relationship, growth, finance scenes for this week.` },
    ], 2000).then(raw => {
      let result;
      try { result = JSON.parse(raw); } catch { const m = raw.match(/\{[\s\S]*\}/); result = m ? JSON.parse(m[0]) : null; }
      if (result?.scenes) {
        fusionCache.set(requestId, { status: 'ready', scenes: result.scenes });
        fusionCache.set(weekKey, result.scenes); // 持久缓存本周
      } else {
        fusionCache.set(requestId, { status: 'failed', scenes: null });
      }
    }).catch(() => fusionCache.set(requestId, { status: 'failed', scenes: null }));

    res.json({ success: true, ...localResult, requestId });
  } catch (err) {
    console.error('Scenes error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * API: 记录用户反馈
 */
app.post('/api/feedback', (req, res) => {
  const { type, rating, content } = req.body;
  console.log(`Feedback: ${type} → ${rating} (${(content || '').slice(0, 50)})`);
  res.json({ success: true });
});

/**
 * 获取记忆上下文（从localStorage模拟，服务端暂用日志）
 */
function getMemoryContext() {
  // 服务端版本：未来可接入数据库
  // 目前返回空，前端已通过 localStorage 管理
  return '';
}

/**
 * API: 获取可用模型列表
 */
app.get('/api/models', (req, res) => {
  const providers = getAvailableProviders();
  const active = configStore.getActiveModel();
  res.json({ success: true, providers, active });
});

/**
 * API: 切换模型
 */
app.post('/api/models/select', (req, res) => {
  const { provider, model, temperature, maxTokens } = req.body;
  if (!provider) return res.status(400).json({ success: false, error: 'provider required' });

  const providerConfig = require('./providers').getProvider(provider);
  if (!providerConfig) return res.status(400).json({ success: false, error: `Unknown provider: ${provider}` });
  if (!providerConfig.apiKey) return res.status(400).json({ success: false, error: `${providerConfig.name} API key not configured` });

  // 验证 model 属于该 provider
  if (model && !providerConfig.models.some(m => m.id === model)) {
    return res.status(400).json({ success: false, error: `Model ${model} not available for ${providerConfig.name}` });
  }

  configStore.setActiveModel(provider, model, temperature, maxTokens);
  const updated = configStore.getActiveModel();
  console.log(`Model switched: ${updated.provider}/${updated.model}`);
  res.json({ success: true, active: updated });
});

/**
 * 健康检查
 */
app.get('/api/health', (req, res) => {
  const active = configStore.getActiveModel();
  res.json({ status: 'ok', provider: active.provider, model: active.model, timestamp: new Date().toISOString() });
});

/**
 * 管理后台页面
 */
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin.html'));
});

/**
 * 默认路由 → index.html
 */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n✦ Soul Cosmos Server`);
  console.log(`  Local:   http://localhost:${PORT}`);
  const active = configStore.getActiveModel();
  console.log(`  Provider: ${active.provider}`);
  console.log(`  Model:    ${active.model}`);
  const { getProvider } = require('./providers');
  const providerConfig = getProvider(active.provider);
  const key = providerConfig?.apiKey || '';
  console.log(`  API Key:  ${key.slice(0, 8)}...`);
  console.log(`\n  Ready.\n`);
});
