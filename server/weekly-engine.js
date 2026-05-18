// server/weekly-engine.js

function generateWeeklyForecast(userTags, date) {
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay());

  const theme = getWeeklyTheme(date);
  const highlight = getHighlightDay(weekStart);

  return {
    weekOf: weekStart.toISOString().split('T')[0],
    forecast: {
      theme: theme.zh,
      themeEn: theme.en,
      highlightDay: highlight.day,
      highlightReason: highlight.reason,
    },
  };
}

function getWeeklyTheme(date) {
  const weekOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 604800000);
  const themes = [
    { zh: '本周适合沉淀与反思，不必急于推进。', en: 'A week for reflection, not action. Let things settle.' },
    { zh: '社交能量高涨，适合拓展人脉和合作。', en: 'Social energy is high. Great for networking and collaboration.' },
    { zh: '创造力爆发的一周，大胆表达你的想法。', en: 'Creative energy peaks. Express your ideas boldly.' },
    { zh: '财务和事业上有好消息，保持专注。', en: 'Good news in career or finances. Stay focused.' },
    { zh: '情感关系成为焦点，适合深度对话。', en: 'Relationships take center stage. Have that deep conversation.' },
    { zh: '身体需要关注，适当放慢节奏。', en: 'Your body needs attention. Slow down and rest.' },
    { zh: '新机会正在酝酿，保持开放心态。', en: 'New opportunities are brewing. Stay open.' },
  ];
  return themes[weekOfYear % themes.length];
}

function getHighlightDay(weekStart) {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const idx = (weekStart.getDate() + 2) % 7;
  return {
    day: days[idx],
    dayEn: daysEn[idx],
    reason: '能量最集中的一天，适合推进重要事项。',
    reasonEn: 'Energy peaks on this day — ideal for important matters.',
  };
}

module.exports = { generateWeeklyForecast };
