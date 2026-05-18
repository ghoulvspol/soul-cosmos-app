// server/daily-engine.js
const templateDB = require('./template-db');

function generateDailyForecast(userTags, date) {
  const transitTag = getDailyTransitTag(userTags, date);
  const ziweiTag = getDailyZiweiTag(date);
  const hexagramTag = getDailyHexagramTag(date);

  const result = templateDB.matchDaily({
    transits: [transitTag],
    dailyZiwei: { palace: ziweiTag },
    hexagram: hexagramTag,
  }, userTags.gender);

  const mood = getDailyMood(transitTag, ziweiTag);

  return {
    date: date.toISOString().split('T')[0],
    forecast: {
      theme: result.zh || result.en || '今天一切如常',
      tip: result.en || result.zh || 'Stay present and trust the flow.',
      mood,
    },
  };
}

function getDailyTransitTag(userTags, date) {
  const sunSign = userTags.natalChart?.sun?.name || 'Aries';
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  const lunarPhase = ['new-moon', 'waxing', 'full-moon', 'waning'][Math.floor(dayOfYear / 7) % 4];
  return `${sunSign.toLowerCase()}-${lunarPhase}`;
}

function getDailyZiweiTag(date) {
  const palaces = ['命宫', '兄弟宫', '夫妻宫', '子女宫', '财帛宫', '疾厄宫', '迁移宫', '交友宫', '官禄宫', '田宅宫', '福德宫', '父母宫'];
  return palaces[date.getDate() % 12];
}

function getDailyHexagramTag(date) {
  return date.getDate() % 64 + 1;
}

function getDailyMood(transit, ziwei) {
  const moods = ['creative', 'reflective', 'social', 'quiet'];
  return moods[Math.floor(Math.random() * moods.length)];
}

module.exports = { generateDailyForecast };
