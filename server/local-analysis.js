/**
 * Soul Cosmos - 本地分析引擎
 * 把确定性分析（八字/星盘/紫微/易经/MBTI）全部本地计算
 * 只有最终融合需要调 AI → 从 6 次 API 降到 1 次
 */

// ========== 八字分析 ==========
function analyzeBazi(bazi, isZh) {
  if (!bazi) return null;
  const { fourPillars, riZhu, riZhuWuXing, riZhuYinYang, riZhuTrait, geJu, wuXing } = bazi;

  const traits = {
    '金': { zh: '果断坚毅，重义气，有领导力', en: 'Decisive and resolute, values loyalty, natural leader' },
    '木': { zh: '仁慈宽容，有创造力，善于成长', en: 'Benevolent and creative,善于growth and expansion' },
    '水': { zh: '智慧灵活，善于变通，洞察力强', en: 'Wise and adaptable, strong insight and perception' },
    '火': { zh: '热情开朗，有感染力，追求光明', en: 'Passionate and charismatic, pursues illumination' },
    '土': { zh: '稳重踏实，包容力强，注重实际', en: 'Steady and pragmatic, strong包容力, grounded' },
  };

  const trait = traits[riZhuWuXing] || traits['火'];
  const lack = wuXing?.lack || '';
  const dominant = wuXing?.dominant || '';

  const reasoning = isZh
    ? `日主${riZhu}（${riZhuWuXing}，${riZhuYinYang}），${riZhuTrait || trait.zh}。格局${geJu}。五行${dominant}为主导${lack ? '，缺' + lack : ''}。`
    : `Day Master ${riZhu} (${riZhuWuXing}, ${riZhuYinYang}). Pattern: ${geJu}. Dominant: ${dominant}${lack ? ', lacking: ' + lack : ''}.`;

  return {
    system: isZh ? '八字命理' : 'BaZi (八字)',
    icon: '📜',
    input: fourPillars || '',
    reasoning,
    conclusion: isZh ? `先天格局：${geJu}，${lack ? '五行缺' + lack + '需补' : '五行均衡'}` : `Pattern: ${geJu}${lack ? ', need ' + lack : ''}`,
  };
}

// ========== 星盘分析 ==========
function analyzeAstrology(natalChart, isZh) {
  if (!natalChart) return null;
  const { sun, moon, rising, dominantElement } = natalChart;

  const elementTraits = {
    'Fire': { zh: '热情、行动力、创造力', en: 'passion, action, creativity' },
    'Earth': { zh: '务实、稳定、耐心', en: 'practicality, stability, patience' },
    'Air': { zh: '智慧、沟通、社交', en: 'intellect, communication, social grace' },
    'Water': { zh: '直觉、情感、深度', en: 'intuition, emotion, depth' },
  };

  const et = elementTraits[dominantElement] || elementTraits['Fire'];
  const input = `${sun.name}/${moon.name}/${rising.name}`;

  const reasoning = isZh
    ? `${sun.name}太阳赋予${sun.element}核心驱动力，${moon.name}月亮带来${moon.element}情感深度，${rising.name}上升塑造${rising.element}外在表现。${dominantElement}元素主导。`
    : `${sun.name} Sun provides ${sun.element} drive, ${moon.name} Moon brings ${moon.element} emotional depth, ${rising.name} Rising shapes ${rising.element} outer persona. ${dominantElement}-dominant.`;

  return {
    system: isZh ? '西方星盘' : 'Western Astrology',
    icon: '🌌',
    input,
    reasoning,
    conclusion: isZh ? `核心原型：${dominantElement}元素主导的${sun.name}灵魂` : `Archetype: ${dominantElement}-dominated ${sun.name} soul`,
  };
}

// ========== 紫微斗数分析 ==========
function analyzeZiwei(ziweiChart, isZh) {
  if (!ziweiChart) return null;
  const { mainStar, lifePalace, careerPalace } = ziweiChart;

  const starTraits = {
    '紫微': { zh: '帝王气质，领导力强，追求卓越', en: 'Imperial aura, strong leadership, pursues excellence' },
    '天机': { zh: '聪明机智，善于谋略，思维敏捷', en: 'Clever and strategic, quick-minded' },
    '太阳': { zh: '热情大方，乐于助人，光明磊落', en: 'Generous and热心, helps others, above-board' },
    '武曲': { zh: '刚毅果断，财运佳，重义气', en: 'Resolute and decisive, good with finances' },
    '天同': { zh: '温和善良，人缘好，享受生活', en: 'Gentle and kind, popular, enjoys life' },
    '廉贞': { zh: '情感丰富，魅力强，有艺术天赋', en: 'Emotionally rich, charismatic, artistic talent' },
    '天府': { zh: '稳重踏实，财运好，有积累能力', en: 'Steady and grounded, good wealth accumulation' },
    '太阴': { zh: '细腻敏感，直觉强，有母性光辉', en: 'Delicate and perceptive, strong intuition' },
    '贪狼': { zh: '欲望强烈，多才多艺，追求变化', en: 'Strong desires, versatile, seeks variety' },
    '巨门': { zh: '口才好，分析力强，善于辩论', en: 'Eloquent, analytical, skilled debater' },
    '天相': { zh: '公正和谐，善于协调，外交手腕', en: 'Fair and harmonious, diplomatic' },
    '天梁': { zh: '有长辈缘，正义感强，善于化解', en: 'Elder connections, strong sense of justice' },
    '七杀': { zh: '冲劲十足，有魄力，敢于冒险', en: 'Drive and courage,敢于taking risks' },
    '破军': { zh: '变革创新，不拘一格，开创能力强', en: 'Innovative and unconventional, pioneer spirit' },
  };

  const trait = starTraits[mainStar] || { zh: '独特命格', en: 'Unique destiny pattern' };
  const reasoning = isZh
    ? `${mainStar}星落入${lifePalace}，${trait.zh}。${careerPalace}宫揭示事业方向。`
    : `${mainStar} star in ${lifePalace}: ${trait.en}. Career palace reveals professional direction.`;

  return {
    system: isZh ? '紫微斗数' : 'Zi Wei Dou Shu',
    icon: '☯',
    input: mainStar,
    reasoning,
    conclusion: isZh ? `命理格局：${mainStar}主导` : `Pattern: ${mainStar} dominant`,
  };
}

// ========== 易经分析 ==========
function analyzeIching(iching, isZh) {
  if (!iching) return null;
  const { number, name, english, judgment, judgmentEn, keywords, personality } = iching;

  const reasoning = isZh
    ? `本命卦${number}.${name}（${english}）：${judgment || ''}。${personality || ''}`
    : `Natal hexagram ${number}. ${english}: ${judgmentEn || ''} ${personality || ''}`;

  return {
    system: isZh ? '易经' : 'I Ching',
    icon: '☯️',
    input: `${number}. ${name} (${english})`,
    reasoning,
    conclusion: isZh ? `生命能量：${(keywords || []).join('、')}` : `Life energy: ${(keywords || []).join(', ')}`,
  };
}

// ========== MBTI 分析 ==========
function analyzeMBTI(mbtiType, isZh) {
  if (!mbtiType) return null;

  const typeInsights = {
    'INTJ': { zh: '独立思考者，战略眼光，追求效率和完美', en: 'Independent thinker, strategic vision, pursues efficiency' },
    'INTP': { zh: '逻辑探索者，好奇心强，热爱理论分析', en: 'Logical explorer, curious, loves theoretical analysis' },
    'ENTJ': { zh: '天生领导者，果断高效，目标导向', en: 'Natural leader, decisive and efficient, goal-oriented' },
    'ENTP': { zh: '创新辩论家，思维敏捷，善于发现可能性', en: 'Innovative debater, quick-minded, sees possibilities' },
    'INFJ': { zh: '理想主义导师，洞察人心，追求意义', en: 'Idealistic mentor, sees through people, pursues meaning' },
    'INFP': { zh: '治愈型理想者，内心丰富，忠于价值观', en: 'Healing idealist, rich inner world, loyal to values' },
    'ENFJ': { zh: '魅力引导者，善于激励他人，天生教练', en: 'Charismatic guide,激励others, natural coach' },
    'ENFP': { zh: '热情创意家，感染力强，追求可能性', en: 'Enthusiastic creator, infectious energy, seeks possibilities' },
    'ISTJ': { zh: '可靠执行者，注重细节，忠诚负责', en: 'Reliable executor, detail-oriented, loyal and responsible' },
    'ISFJ': { zh: '守护型奉献者，温暖细心，默默付出', en: 'Guardian nurturer, warm and attentive, quietly devoted' },
    'ESTJ': { zh: '组织管理者，高效务实，注重秩序', en: 'Organizing manager, efficient and practical, values order' },
    'ESFJ': { zh: '社交协调者，热心助人，营造和谐', en: 'Social coordinator, helpful, creates harmony' },
    'ISTP': { zh: '灵活工匠，动手能力强，冷静分析', en: 'Flexible craftsperson, hands-on, calm analyzer' },
    'ISFP': { zh: '温和艺术家，审美敏锐，享受当下', en: 'Gentle artist, aesthetic sensitivity, lives in the moment' },
    'ESTP': { zh: '行动冒险家，反应快，善于抓住机会', en: 'Action adventurer, quick reflexes, seizes opportunities' },
    'ESFP': { zh: '活力表演者，热情洋溢，享受生活', en: 'Energetic performer,热情overflowing, enjoys life' },
  };

  const insight = typeInsights[mbtiType] || { zh: `${mbtiType}型人格`, en: `${mbtiType} personality` };

  return {
    system: 'MBTI',
    icon: '🧠',
    input: mbtiType,
    reasoning: isZh ? `${mbtiType}型：${insight.zh}` : `${mbtiType}: ${insight.en}`,
    conclusion: isZh ? `决策风格：${mbtiType[0] === 'I' ? '内向直觉' : '外向感觉'}主导` : `Style: ${mbtiType[0] === 'I' ? 'Introverted' : 'Extraverted'} dominant`,
  };
}

/**
 * 生成全部本地分析（0ms，无 API 调用）
 */
function generateLocalAnalysis(input) {
  const { natalChart, mbtiType, ziweiChart, iching, bazi, lang } = input;
  const isZh = lang === 'zh';
  const steps = [];

  const baziStep = analyzeBazi(bazi, isZh);
  if (baziStep) steps.push(baziStep);

  const astroStep = analyzeAstrology(natalChart, isZh);
  if (astroStep) steps.push(astroStep);

  const ziweiStep = analyzeZiwei(ziweiChart, isZh);
  if (ziweiStep) steps.push(ziweiStep);

  const ichingStep = analyzeIching(iching, isZh);
  if (ichingStep) steps.push(ichingStep);

  const mbtiStep = analyzeMBTI(mbtiType, isZh);
  if (mbtiStep) steps.push(mbtiStep);

  return steps;
}

module.exports = { generateLocalAnalysis, analyzeBazi, analyzeAstrology, analyzeZiwei, analyzeIching, analyzeMBTI };
