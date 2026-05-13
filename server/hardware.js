/**
 * Soul Cosmos - 硬件对接模块
 * WebSocket 实时通信 + 语音交互 API + 闹铃黄历推送
 *
 * 白皮书 Phase 2: 智能音箱集成
 * 白皮书 Phase 3: 树莓派原型
 * 白皮书 Phase 4: 品牌硬件
 */
const { generateDailyFortune } = require('./daily');
const { callMify } = require('./mify');

/**
 * 处理语音交互请求
 * ASR 文本 → Harness 理解 → 生成回答
 */
async function handleVoiceQuery(userId, query, lang) {
  const today = new Date().toISOString().slice(0, 10);
  const fortune = generateDailyFortune(userId, today);

  const systemPrompt = `You are Soul Cosmos bedside assistant — a warm, concise voice companion.
The user asked: "${query}"

Today's almanac:
- Day: ${fortune.almanac.dayGanZhi} (${fortune.almanac.dayElement})
- Score: ${fortune.almanac.score}/100
- Yi (Auspicious): ${fortune.almanac.yi.join(', ')}
- Ji (Inauspicious): ${fortune.almanac.ji.join(', ')}
- Lucky hours: ${fortune.almanac.luckyHours.join(', ')}
${fortune.personalNote ? `- Personal note: ${fortune.personalNote}` : ''}

Rules:
- Respond in ${lang === 'zh' ? 'Chinese' : 'English'}
- Keep response under 100 words (voice-friendly)
- Be warm, specific, and actionable
- If asked about timing, reference the almanac
- If asked about feelings, reference their astrological profile
- End with a brief encouragement`;

  try {
    const response = await callMify([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query },
    ], 300);

    return { success: true, response, almanac: fortune.almanac };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * 生成闹铃播报内容
 * 每日早晨自动推送：日期、宜忌、运势摘要
 */
function generateAlarmBrief(userId, lang) {
  const today = new Date().toISOString().slice(0, 10);
  const fortune = generateDailyFortune(userId, today);
  const { almanac, personalNote } = fortune;
  const isZh = lang === 'zh';

  const greeting = isZh
    ? `早安，今天是${almanac.dayGanZhi}日，五行属${almanac.dayElement}。`
    : `Good morning. Today is ${almanac.dayGanZhi} day, element: ${almanac.dayElement}.`;

  const score = isZh
    ? `综合运势${almanac.score}分。`
    : `Overall fortune: ${almanac.score}/100.`;

  const yi = isZh
    ? `今日宜：${almanac.yi.join('、')}。`
    : `Auspicious activities: ${almanac.yi.join(', ')}.`;

  const ji = isZh
    ? `今日忌：${almanac.ji.join('、')}。`
    : `Avoid: ${almanac.ji.join(', ')}.`;

  const lucky = isZh
    ? `吉时：${almanac.luckyHours.join('、')}。吉方：${almanac.luckyDirection}。`
    : `Lucky hours: ${almanac.luckyHours.join(', ')}. Lucky direction: ${almanac.luckyDirection}.`;

  const text = [greeting, score, yi, ji, lucky, personalNote].filter(Boolean).join(' ');

  return {
    success: true,
    date: today,
    text,
    almanac,
    personalNote,
  };
}

/**
 * 生成周报摘要（每周一推送）
 */
async function generateWeeklyReport(userId, lang) {
  const isZh = lang === 'zh';
  const today = new Date();
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    weekDates.push(d.toISOString().slice(0, 10));
  }

  const almanacs = weekDates.map(d => generateAlmanac(d));
  const avgScore = Math.round(almanacs.reduce((s, a) => s + a.score, 0) / 7);

  const systemPrompt = `You are Soul Cosmos weekly advisor.
Generate a concise weekly forecast based on 7-day almanac data.
Respond in ${isZh ? 'Chinese' : 'English'}.
Keep it under 150 words. Be practical and encouraging.`;

  const summary = almanacs.map((a, i) =>
    `${weekDates[i]}: ${a.dayGanZhi} (${a.dayElement}) ${a.score}pts`
  ).join('\n');

  try {
    const forecast = await callMify([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Weekly almanac data:\n${summary}\nAverage score: ${avgScore}\n\nWrite a practical weekly forecast.` },
    ], 400);

    return { success: true, forecast, avgScore, dates: weekDates };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// 导入 generateAlmanac
const { generateAlmanac } = require('./daily');

module.exports = { handleVoiceQuery, generateAlarmBrief, generateWeeklyReport };
