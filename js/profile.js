/**
 * Soul Cosmos - AI融合分析引擎（本地模拟版）
 * 基于星盘+MBTI+紫微多维度数据生成人格画像
 */
const ProfileEngine = {
  /**
   * 生成灵魂画像
   */
  generate(natalChart, mbtiType, ziweiChart) {
    const sun = natalChart.sun;
    const moon = natalChart.moon;
    const rising = natalChart.rising;

    // 生成灵魂关键词
    const keywords = this._generateKeywords(sun, moon, rising, mbtiType, ziweiChart);

    // 生成一句话画像
    const portrait = this._generatePortrait(sun, moon, rising, mbtiType);

    // 生成核心特质
    const traits = this._generateTraits(sun, moon, rising, mbtiType, ziweiChart);

    // 生成阴影面
    const shadows = this._generateShadows(sun, moon, mbtiType);

    // 生成人生主题
    const lifeTheme = this._generateLifeTheme(sun, rising, ziweiChart);

    // 生成每日洞察
    const dailyInsight = this._generateDailyInsight(sun, moon, mbtiType);

    return { keywords, portrait, traits, shadows, lifeTheme, dailyInsight };
  },

  _generateKeywords(sun, moon, rising, mbti, ziwei) {
    const keywordMap = {
      // Sun sign keywords
      'Aries': ['Pioneering', 'Bold', 'Impulsive'],
      'Taurus': ['Grounded', 'Sensual', 'Stubborn'],
      'Gemini': ['Versatile', 'Curious', 'Restless'],
      'Cancer': ['Nurturing', 'Intuitive', 'Protective'],
      'Leo': ['Radiant', 'Generous', 'Dramatic'],
      'Virgo': ['Precise', 'Analytical', 'Devoted'],
      'Libra': ['Harmonious', 'Diplomatic', 'Idealistic'],
      'Scorpio': ['Intense', 'Perceptive', 'Transformative'],
      'Sagittarius': ['Adventurous', 'Philosophical', 'Free-spirited'],
      'Capricorn': ['Ambitious', 'Disciplined', 'Strategic'],
      'Aquarius': ['Visionary', 'Independent', 'Humanitarian'],
      'Pisces': ['Dreamy', 'Empathetic', 'Mystical'],
    };

    const mbtiKeywords = {
      'INTJ': 'Strategic', 'INTP': 'Inventive', 'ENTJ': 'Commanding', 'ENTP': 'Innovative',
      'INFJ': 'Visionary', 'INFP': 'Idealistic', 'ENFJ': 'Inspiring', 'ENFP': 'Enthusiastic',
      'ISTJ': 'Reliable', 'ISFJ': 'Devoted', 'ESTJ': 'Organized', 'ESFJ': 'Warm',
      'ISTP': 'Resourceful', 'ISFP': 'Artistic', 'ESTP': 'Bold', 'ESFP': 'Vivacious',
    };

    const ziweiKeywords = {
      '紫微': 'Regal', '天机': 'Clever', '太阳': 'Radiant', '武曲': 'Determined',
      '天同': 'Gentle', '廉贞': 'Passionate', '天府': 'Abundant', '太阴': 'Receptive',
      '贪狼': 'Ambitious', '巨门': 'Perceptive', '天相': 'Diplomatic', '天梁': 'Wise',
      '七杀': 'Fearless', '破军': 'Revolutionary',
    };

    const pool = [
      ...keywordMap[sun.name] || [],
      mbtiKeywords[mbti] || 'Complex',
      ziweiKeywords[ziwei.mainStar] || 'Unique',
    ];

    // 选择3-5个不重复的关键词
    const shuffled = pool.sort(() => Math.random() - 0.5);
    return [...new Set(shuffled)].slice(0, 4);
  },

  _generatePortrait(sun, moon, rising, mbti) {
    const portraits = {
      'Aries': `A ${rising.name} rising with a fiery Aries sun — you charge into life with the intensity of a thunderstorm, yet your ${moon.name} moon reveals a ${moon.element === 'Water' ? 'deeply emotional' : moon.element === 'Earth' ? 'surprisingly grounded' : 'constantly shifting'} inner world that few get to see.`,
      'Scorpio': `Beneath your ${rising.name} exterior lies the soul of a detective — your Scorpio sun gives you X-ray vision for truth, while your ${moon.name} moon means you feel everything at 10x the intensity of everyone around you.`,
      'Leo': `You were born to shine, and your ${rising.name} rising ensures the world notices — but it's your ${moon.name} moon that reveals the ${moon.element === 'Water' ? 'tender heart' : moon.element === 'Earth' ? 'quiet ambition' : 'restless creativity'} behind the spotlight.`,
      'Pisces': `An old soul in a modern world — your Pisces sun swims between dimensions of reality and imagination, while your ${rising.name} rising and ${moon.name} moon create a ${rising.element === 'Fire' ? 'surprisingly bold' : 'mysteriously magnetic'} presence that draws people in.`,
    };

    // 通用模板
    const generic = `Your ${sun.name} sun burns with ${sun.element === 'Fire' ? 'passionate intensity' : sun.element === 'Earth' ? 'quiet determination' : sun.element === 'Air' ? 'restless curiosity' : 'deep intuition'}, filtered through your ${rising.name} rising's ${rising.element === 'Fire' ? 'bold' : rising.element === 'Earth' ? 'grounded' : rising.element === 'Air' ? 'charming' : 'mysterious'} presence, and anchored by your ${moon.name} moon's ${moon.element === 'Fire' ? 'fiery emotions' : moon.element === 'Earth' ? 'practical heart' : moon.element === 'Air' ? 'intellectual feelings' : 'oceanic depths'}.`;

    return portraits[sun.name] || generic;
  },

  _generateTraits(sun, moon, rising, mbti, ziwei) {
    const allTraits = [
      { trait: 'The ' + (sun.element === 'Fire' ? 'Igniter' : sun.element === 'Earth' ? 'Builder' : sun.element === 'Air' ? 'Connector' : 'Feeler'), desc: `Your ${sun.name} sun gives you an innate ability to ${sun.element === 'Fire' ? 'inspire action and ignite passion in others' : sun.element === 'Earth' ? 'create tangible results and build lasting structures' : sun.element === 'Air' ? 'bridge different worlds and communicate ideas' : 'sense what others miss and navigate emotional depths'}.` },
      { trait: 'The ' + (mbti[0] === 'E' ? 'Social Alchemist' : 'Inner World Architect'), desc: `As an ${mbti}, you ${mbti[0] === 'E' ? 'draw energy from interactions and have a gift for reading rooms' : 'build rich inner landscapes and process the world through deep reflection'}.` },
      { trait: 'The ' + (moon.element === 'Water' ? 'Empath' : moon.element === 'Earth' ? 'Stabilizer' : moon.element === 'Air' ? 'Rationalizer' : 'Instinctive'), desc: `Your ${moon.name} moon means your emotional core is ${moon.element === 'Water' ? 'profoundly empathetic — you absorb others\' feelings like a sponge' : moon.element === 'Earth' ? 'steady and loyal — people feel safe around you' : moon.element === 'Air' ? 'intellectual — you need to understand your feelings before you can express them' : 'intense and instinctive — your gut feelings are almost always right'}.` },
      { trait: 'The Hidden ' + (ziwei.mainStar === '紫微' ? 'Emperor' : ziwei.mainStar === '贪狼' ? 'Ambitious' : ziwei.mainStar === '天机' ? 'Strategist' : 'Mystic'), desc: `Your Zi Wei star ${ziwei.mainStar} reveals a ${ziwei.mainStar === '紫微' ? 'natural authority — people follow you without you asking' : ziwei.mainStar === '贪狼' ? 'multidimensional hunger for experience — you\'re never satisfied with just one path' : ziwei.mainStar === '天机' ? 'brilliant tactical mind — you see 3 moves ahead' : 'deep spiritual dimension that grounds everything you do'}.` },
      { trait: 'The ' + (rising.element === 'Fire' ? 'Trailblazer' : rising.element === 'Earth' ? 'Anchor' : rising.element === 'Air' ? 'Messenger' : 'Mystic'), desc: `Your ${rising.name} rising shapes how the world sees you — ${rising.element === 'Fire' ? 'confident, bold, and impossible to ignore' : rising.element === 'Earth' ? 'reliable, warm, and quietly powerful' : rising.element === 'Air' ? 'witty, engaging, and intellectually magnetic' : 'enigmatic, deep, and emotionally intelligent'}.` },
    ];

    return allTraits;
  },

  _generateShadows(sun, moon, mbti) {
    const shadows = [];

    // Fire sign shadows
    if (sun.element === 'Fire' || moon.element === 'Fire') {
      shadows.push({ challenge: 'The Burnout Cycle', desc: `You ignite everything with intensity — then burn out. Your ${sun.name} nature craves constant stimulation, and when the fire dims, you mistake stillness for stagnation. Learning to smolder instead of always blazing is your lifelong lesson.` });
    }
    // Earth sign shadows
    if (sun.element === 'Earth' || moon.element === 'Earth') {
      shadows.push({ challenge: 'The Stubborn Fortress', desc: `You build walls of certainty that protect you — but also imprison you. Your ${moon.name} moon makes you cling to what\'s familiar, even when growth demands you let go.` });
    }
    // Water sign shadows
    if (sun.element === 'Water' || moon.element === 'Water') {
      shadows.push({ challenge: 'The Emotional Sponge', desc: `You absorb everyone\'s feelings and mistake them for your own. Your ${moon.name} moon makes boundaries feel like betrayal — but without them, you drown in emotions that aren\'t yours.` });
    }
    // Air sign shadows
    if (sun.element === 'Air' || moon.element === 'Air') {
      shadows.push({ challenge: 'The Detached Observer', desc: `You analyze feelings instead of feeling them. Your ${sun.name} mind can rationalize anything — including why you shouldn\'t be vulnerable. The heart wants what the head can\'t explain.` });
    }

    // MBTI shadows
    if (mbti[2] === 'T') {
      shadows.push({ challenge: 'The Emotional Blind Spot', desc: `Your Thinking preference means you solve problems brilliantly — but sometimes people don\'t want solutions. They want to be heard. This gap between logic and empathy is your growing edge.` });
    } else {
      shadows.push({ challenge: 'The People-Pleasing Trap', desc: `Your Feeling function makes you deeply attuned to others — but you sometimes lose yourself in the process. Saying "no" feels like failure, even when it\'s self-preservation.` });
    }

    return shadows.slice(0, 3);
  },

  _generateLifeTheme(sun, rising, ziwei) {
    const themes = {
      'Fire': `Your life is a hero's journey — full of bold quests, dramatic turning points, and the constant tension between the fire that drives you and the stillness that heals you. You're here to ignite something in the world, not just observe it.`,
      'Earth': `You're building something that outlasts you — a legacy, a family, a body of work. Your life theme is about turning invisible effort into tangible reality, brick by brick, even when no one is watching.`,
      'Air': `You're here to connect the dots that others miss — between people, ideas, and eras. Your life is a conversation between the mind and the heart, and your greatest gift is translating one language into the other.`,
      'Water': `You're here to feel what others can't — and transform it into something beautiful. Your life is a journey through emotional depths that would terrify most people, but you emerge each time with pearls of wisdom.`,
    };

    const ziweiTheme = ziwei.mainStar === '紫微' ? ' With your Zi Wei emperor star, you carry a quiet authority that draws people to your vision.' : '';

    return (themes[sun.element] || themes['Fire']) + ziweiTheme;
  },

  _generateDailyInsight(sun, moon, mbti) {
    const today = new Date();
    const dayOfWeek = today.getDay();

    const insights = {
      'Fire': [
        `Today, your inner fire wants to create — but the universe is asking you to pause. The ${moon.name} moon is teaching you that stillness isn't weakness.`,
        `A bold opportunity appears today. Your ${sun.name} instinct says "charge." But your ${moon.name} moon whispers "wait." The answer is somewhere between impulse and patience.`,
        `Your energy is magnetic today. People are drawn to your ${rising ? rising.name : 'natural'} presence. Use it wisely — what you ignite today burns for weeks.`,
      ],
      'Earth': [
        `Today favors concrete action over abstract planning. Your ${sun.name} nature excels at turning ideas into reality — start with one small, tangible step.`,
        `Someone needs your steady presence today. You may not realize it, but your ${moon.name} moon is an anchor for people in chaos. Show up.`,
        `A practical opportunity is hiding behind an unglamorous door. Your ${sun.name} eyes will see it if you stop looking for the dramatic one.`,
      ],
      'Air': [
        `Your mind is especially sharp today — but don't mistake analysis for action. Think less, do more. Your ${sun.name} nature needs movement, not meditation.`,
        `A conversation today could change everything. Your ${moon.name} moon is picking up subtext that others miss. Trust what you feel between the lines.`,
        `You're seeing connections that no one else sees. That's your superpower. But today, choose ONE connection to explore deeply instead of five to skim.`,
      ],
      'Water': [
        `Today's emotions run deep. Your ${moon.name} moon is amplifying everything — don't mistake intensity for truth. Feel it, then let it pass.`,
        `Someone close to you needs emotional support today. Your ${sun.name} intuition already knows who. Reach out before they ask.`,
        `Creative energy is surging. Your ${sun.name} soul is trying to express something that words can't capture — paint, write, sing, move. Let it out.`,
      ],
    };

    const elementInsights = insights[sun.element] || insights['Fire'];
    return elementInsights[dayOfWeek % elementInsights.length];
  },
};
