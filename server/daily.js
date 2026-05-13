/**
 * Soul Cosmos - 每日运势 & 黄历引擎
 * 生成每日个性化运势、宜忌、吉时
 */
const db = require('./db');

// 天干地支
const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const WU_XING_GAN = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水' };
const WU_XING_ZHI = { '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水' };

// 宜忌事项（中英文）
const YI_ITEMS = {
  zh: ['社交', '签约', '面试', '表白', '投资', '学习', '运动', '旅行', '搬家', '开业', '谈判', '创作', '冥想', '聚会', '购物', '维修', '理发', '求医', '祈福', '播种'],
  en: ['Socializing', 'Signing contracts', 'Interviews', 'Confessing love', 'Investing', 'Studying', 'Exercise', 'Traveling', 'Moving', 'Opening business', 'Negotiating', 'Creating', 'Meditation', 'Gathering', 'Shopping', 'Repairs', 'Haircut', 'Medical visit', 'Prayer', 'Planting'],
};
const JI_ITEMS = {
  zh: ['争吵', '赌博', '借贷', '冲动消费', '熬夜', '搬家', '手术', '签约', '长途旅行', '高风险运动'],
  en: ['Arguments', 'Gambling', 'Lending money', 'Impulse buying', 'Staying up late', 'Moving', 'Surgery', 'Signing contracts', 'Long-distance travel', 'Extreme sports'],
};

// 吉时
const LUCKY_HOURS = {
  zh: ['子时 (23:00-01:00)', '丑时 (01:00-03:00)', '寅时 (03:00-05:00)', '卯时 (05:00-07:00)', '辰时 (07:00-09:00)', '巳时 (09:00-11:00)', '午时 (11:00-13:00)', '未时 (13:00-15:00)', '申时 (15:00-17:00)', '酉时 (17:00-19:00)', '戌时 (19:00-21:00)', '亥时 (21:00-23:00)'],
  en: ['Zi (23:00-01:00)', 'Chou (01:00-03:00)', 'Yin (03:00-05:00)', 'Mao (05:00-07:00)', 'Chen (07:00-09:00)', 'Si (09:00-11:00)', 'Wu (11:00-13:00)', 'Wei (13:00-15:00)', 'Shen (15:00-17:00)', 'You (17:00-19:00)', 'Xu (19:00-21:00)', 'Hai (21:00-23:00)'],
};

// 五行英文
const WU_XING_EN = { '木': 'Wood', '火': 'Fire', '土': 'Earth', '金': 'Metal', '水': 'Water' };
const DIRECTION_EN = { '东': 'East', '南': 'South', '西': 'West', '北': 'North' };
const COLOR_EN = { '红': 'Red', '黄': 'Yellow', '白': 'White', '黑': 'Black', '绿': 'Green' };

/**
 * 计算日柱干支（简化版，基于日期偏移）
 */
function getDayGanZhi(date) {
  const d = new Date(date);
  const baseDate = new Date('2000-01-07'); // 甲子日
  const diff = Math.floor((d - baseDate) / 86400000);
  const ganIdx = ((diff % 10) + 10) % 10;
  const zhiIdx = ((diff % 12) + 12) % 12;
  return {
    gan: TIAN_GAN[ganIdx],
    zhi: DI_ZHI[zhiIdx],
    ganZhi: TIAN_GAN[ganIdx] + DI_ZHI[zhiIdx],
    wuXing: WU_XING_GAN[TIAN_GAN[ganIdx]],
  };
}

/**
 * 生成每日黄历（确定性，基于日期 hash）
 */
function generateAlmanac(date, lang) {
  const isZh = lang !== 'en';
  const L = isZh ? 'zh' : 'en';
  const d = new Date(date);
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const dayGZ = getDayGanZhi(date);

  // 伪随机（基于日期 seed）
  const rand = (n) => {
    const x = Math.sin(seed * 9301 + n * 49297) * 49297;
    return x - Math.floor(x);
  };

  const yiSrc = YI_ITEMS[L];
  const jiSrc = JI_ITEMS[L];
  const hoursSrc = LUCKY_HOURS[L];

  // 宜（3-5 项）
  const yiCount = 3 + Math.floor(rand(1) * 3);
  const yi = [];
  const usedYi = new Set();
  for (let i = 0; i < yiCount; i++) {
    let idx;
    do { idx = Math.floor(rand(10 + i) * yiSrc.length); } while (usedYi.has(idx));
    usedYi.add(idx);
    yi.push(yiSrc[idx]);
  }

  // 忌（2-3 项）
  const jiCount = 2 + Math.floor(rand(2) * 2);
  const ji = [];
  const usedJi = new Set();
  for (let i = 0; i < jiCount; i++) {
    let idx;
    do { idx = Math.floor(rand(20 + i) * jiSrc.length); } while (usedJi.has(idx));
    usedJi.add(idx);
    ji.push(jiSrc[idx]);
  }

  // 吉时（2-3 个）
  const luckyHourCount = 2 + Math.floor(rand(3) * 2);
  const luckyHours = [];
  const usedHours = new Set();
  for (let i = 0; i < luckyHourCount; i++) {
    let idx;
    do { idx = Math.floor(rand(30 + i) * hoursSrc.length); } while (usedHours.has(idx));
    usedHours.add(idx);
    luckyHours.push(hoursSrc[idx]);
  }

  // 运势评分（60-95）
  const score = 60 + Math.floor(rand(4) * 36);

  const dirZh = ['东', '南', '西', '北'][Math.floor(rand(5) * 4)];
  const colorZh = ['红', '黄', '白', '黑', '绿'][Math.floor(rand(6) * 5)];

  return {
    date,
    dayGanZhi: dayGZ.ganZhi,
    dayElement: isZh ? dayGZ.wuXing : (WU_XING_EN[dayGZ.wuXing] || dayGZ.wuXing),
    score,
    yi,
    ji,
    luckyHours,
    luckyDirection: isZh ? dirZh : (DIRECTION_EN[dirZh] || dirZh),
    luckyColor: isZh ? colorZh : (COLOR_EN[colorZh] || colorZh),
  };
}

/**
 * 生成用户个性化每日运势文本
 */
function generateDailyFortune(userId, date, lang) {
  const almanac = generateAlmanac(date, lang);

  // 获取用户画像
  const profile = db.prepare(
    'SELECT mbti_type, natal_chart, soul_profile FROM profiles WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
  ).get(userId);

  let personalNote = '';
  if (profile) {
    const natalChart = profile.natal_chart ? JSON.parse(profile.natal_chart) : null;
    const element = natalChart?.sun?.element || '';
    const dayElement = almanac.dayElement;

    // 五行生克关系
    const sheng = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
    const ke = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

    if (element === dayElement) {
      personalNote = `今日${dayElement}气旺盛，与你的${element}命相合，能量充沛。`;
    } else if (sheng[element] === dayElement) {
      personalNote = `今日${dayElement}得你${element}生助，适合主动出击。`;
    } else if (ke[element] === dayElement) {
      personalNote = `今日${dayElement}克你的${element}，宜低调行事，以守为攻。`;
    } else if (sheng[dayElement] === element) {
      personalNote = `今日${dayElement}生你的${element}，贵人运旺，事半功倍。`;
    } else {
      personalNote = `今日${dayElement}与你的${element}无直接生克，平稳过渡。`;
    }
  }

  return { almanac, personalNote };
}

module.exports = { generateAlmanac, generateDailyFortune, getDayGanZhi };
