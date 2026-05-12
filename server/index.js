/**
 * Soul Cosmos - 后端代理服务
 * 调用 Mify 网关的 Mimo 模型生成灵魂画像
 */
const express = require('express');
const path = require('path');
const http = require('http');
const https = require('https');

const app = express();
const PORT = 8066;

// Mify 网关配置
const MIFY_HOST = 'model.mify.ai.srv';
const MIFY_PORT = 80;
const MIFY_PATH = '/v1/chat/completions';
const MIFY_MODEL = 'xiaomi/mimo-v2.5-pro';

// 从环境变量读取 API Key
const MIFY_API_KEY = process.env.MIFY_API_KEY;
if (!MIFY_API_KEY) {
  console.error('❌ Missing $MIFY_API_KEY. Run: export MIFY_API_KEY=sk-...');
  process.exit(1);
}

// 静态文件服务
app.use(express.static(path.join(__dirname, '..')));
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

/**
 * 调用 Mify 网关
 */
function callMify(messages, maxTokens = 2000) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MIFY_MODEL,
      messages,
      temperature: 0.8,
      max_tokens: maxTokens,
    });

    const options = {
      hostname: MIFY_HOST,
      port: MIFY_PORT,
      path: MIFY_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MIFY_API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(json.error.message || JSON.stringify(json.error)));
          } else {
            const content = json.choices?.[0]?.message?.content || '';
            resolve(content);
          }
        } catch (e) {
          reject(new Error(`Parse error: ${data.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
}

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
 * API: 生成灵魂画像
 */
app.post('/api/generate-profile', async (req, res) => {
  try {
    const { natalChart, mbtiType, ziweiChart, iching, lang } = req.body;
    const outputLang = lang === 'zh' ? 'Chinese (中文)' : 'English';

    if (!natalChart || !mbtiType) {
      return res.status(400).json({ error: 'Missing natalChart or mbtiType' });
    }

    const systemPrompt = `You are SOUL COSMOS — a master personality analyst who synthesizes insights from Western Astrology, Eastern Zi Wei Dou Shu (紫微斗数), I Ching (易经), MBTI personality typing, and Blood Type theory.

CRITICAL: You MUST respond entirely in ${outputLang}. All field values (soulKeywords, oneSentencePortrait, coreTraits, shadows, lifeTheme, dailyInsight) must be in ${outputLang}.

Your writing style:
- Warm but precise, like a wise friend who truly sees you
- Use specific astrological/placement details, never generic
- Blend Eastern and Western metaphors naturally
- Avoid fortune-cookie language or Barnum effect statements
- Be honest about shadows, not just flattering
- Write in English

You MUST respond with valid JSON in this exact format:
{
  "soulKeywords": ["word1", "word2", "word3", "word4"],
  "oneSentencePortrait": "A deeply personal, specific sentence about this person",
  "coreTraits": [
    {"trait": "Trait Name", "description": "2-3 sentence explanation with specific astrological references"}
  ],
  "shadows": [
    {"challenge": "Challenge Name", "description": "Honest but compassionate description"}
  ],
  "lifeTheme": "The overarching narrative of this person's life journey, 2-3 sentences",
  "dailyInsight": "A personalized daily insight for today, 1-2 sentences, punchy and specific"
}

IMPORTANT: Output ONLY the JSON object. No markdown, no explanation, no code blocks.`;

    const userPrompt = `Generate a soul profile for this person:

WESTERN NATAL CHART:
- Sun: ${natalChart.sun.name} (${natalChart.sun.element}, ${natalChart.sun.quality})
- Moon: ${natalChart.moon.name} (${natalChart.moon.element})
- Rising/Ascendant: ${natalChart.rising.name} (${natalChart.rising.element})
- Dominant Element: ${natalChart.dominantElement}

MBTI TYPE: ${mbtiType}

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

Create a deeply personal, specific soul portrait. Fuse ALL systems (Astrology + Zi Wei + I Ching + MBTI) into ONE coherent description — do NOT list each system separately. Make the person feel "this is SO me."`;

    const rawResponse = await callMify([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], 2000);

    // 解析 JSON（健壮版）
    let profile;
    try {
      // 清理响应：去掉 markdown 代码块、BOM、控制字符
      let cleaned = rawResponse
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .replace(/^\s*[\uFEFF\u200B]+/g, '')
        .trim();

      // 尝试直接解析
      profile = JSON.parse(cleaned);
    } catch (e1) {
      try {
        // 尝试提取第一个 JSON 对象
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          // 修复常见问题：尾部逗号、单引号
          let fixed = jsonMatch[0]
            .replace(/,\s*([\]}])/g, '$1')  // 去尾逗号
            .replace(/'/g, '"');  // 单引号→双引号（谨慎）
          profile = JSON.parse(fixed);
        } else {
          throw new Error('No JSON found');
        }
      } catch (e2) {
        // 最后兜底：手动提取关键字段
        console.warn('JSON parse failed, extracting manually. Raw:', rawResponse.slice(0, 500));
        profile = extractManually(rawResponse);
      }
    }

    res.json({ success: true, profile, model: MIFY_MODEL });
  } catch (err) {
    console.error('Generate profile error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * API: 生成每日洞察
 */
app.post('/api/daily-insight', async (req, res) => {
  try {
    const { soulKeywords, portrait, sunSign, moonSign, mbtiType } = req.body;

    const systemPrompt = `You are writing a daily insight for a specific person based on their unique soul profile.
Style: Like Co-Star but warmer and more insightful. Short, punchy, personal. Use emoji sparingly.
Format: One paragraph, 2-3 sentences max. Start with an action or observation, not a greeting.
Today's date: ${new Date().toISOString().slice(0, 10)}
Write in English.`;

    const userPrompt = `Soul Keywords: ${soulKeywords?.join(', ')}
Portrait: ${portrait}
Sun: ${sunSign}, Moon: ${moonSign}, MBTI: ${mbtiType}

Write today's personalized insight. Make it feel like you're reading their mind. Be specific to their profile, not generic.`;

    const insight = await callMify([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], 300);

    res.json({ success: true, insight, model: MIFY_MODEL });
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
    const { profileA, profileB } = req.body;

    const systemPrompt = `You are analyzing the compatibility between two people based on their combined natal charts and MBTI types.
Write in English. Be specific and insightful.
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

    res.json({ success: true, compatibility, model: MIFY_MODEL });
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
    const { myProfile, people } = req.body;
    if (!people?.length) return res.json({ forecasts: [] });

    const peopleList = people.map((p, i) =>
      `${i + 1}. ${p.name} (${p.relation}): ${p.sun} Sun, ${p.mbti} MBTI`
    ).join('\n');

    const systemPrompt = `You are a relationship intelligence advisor combining Western astrology, Eastern philosophy, and social psychology.
Write in English. Be practical, specific, and slightly humorous — like a wise friend giving real advice.
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

    res.json({ success: true, forecasts: result.forecasts || [], model: MIFY_MODEL });
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

    const systemPrompt = `You are a Feng Shui master with deep knowledge of Chinese metaphysics, combined with modern interior design sensibility.
Write in English. Be practical — give advice people can actually follow without renovating their home.
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

    res.json({ success: true, fengshui: result, model: MIFY_MODEL });
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
    const { type, userProfile } = req.body;
    const memoryContext = getMemoryContext();

    const systemPrompt = `You are a ${type === 'face' ? 'face reading (面相)' : 'palm reading (手相)'} master combining Chinese physiognomy with modern psychology.
Write in English. Be specific and insightful.
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

    res.json({ success: true, analysis: result, model: MIFY_MODEL });
  } catch (err) {
    console.error('Photo analysis error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * API: 周度场景建议
 */
app.post('/api/scenes', async (req, res) => {
  try {
    const { userProfile } = req.body;
    const memoryContext = getMemoryContext();

    const systemPrompt = `You are a life scene advisor combining Eastern metaphysics, Western astrology, and social psychology.
Generate 3-4 weekly scene-based advice cards for the user.
Today is ${new Date().toISOString().slice(0, 10)}.
Write in English. Be practical, specific, and slightly humorous.
${memoryContext}

Respond with valid JSON:
{
  "scenes": [
    {
      "icon": "💼",
      "title": "Scene Title",
      "tag": "Workplace",
      "tagColor": "rgba(96,165,250,0.1)",
      "tagTextColor": "#60a5fa",
      "body": "2-3 sentences describing the scene and energy this week",
      "advice": "One specific action to take"
    }
  ]
}
Generate scenes for: Workplace, Relationships, Personal Growth, and optionally Finance or Health.
Output ONLY the JSON.`;

    const userPrompt = `User profile:
- Sun: ${userProfile?.sun || 'Unknown'}, Moon: ${userProfile?.moon || 'Unknown'}, Rising: ${userProfile?.rising || 'Unknown'}
- Element: ${userProfile?.element || 'Unknown'}
- MBTI: ${userProfile?.mbti || 'Unknown'}

Generate this week's life scene advice. Be specific to their astrological profile. Make it feel like you actually know them.`;

    const rawResponse = await callMify([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], 2000);

    let result;
    try {
      result = JSON.parse(rawResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim());
    } catch {
      const match = rawResponse.match(/\{[\s\S]*\}/);
      result = match ? JSON.parse(match[0]) : { scenes: [] };
    }

    res.json({ success: true, scenes: result.scenes || [], model: MIFY_MODEL });
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
 * 健康检查
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', model: MIFY_MODEL, timestamp: new Date().toISOString() });
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
  console.log(`  Model:   ${MIFY_MODEL}`);
  console.log(`  API Key: ${MIFY_API_KEY.slice(0, 8)}...`);
  console.log(`\n  Ready.\n`);
});
