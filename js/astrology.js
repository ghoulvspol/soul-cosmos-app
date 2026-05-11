/**
 * Soul Cosmos - 星座计算引擎
 * 简化版：基于日期计算太阳/月亮/上升星座
 */
const Astrology = {
  SIGNS: [
    { name: 'Aries', symbol: '♈', element: 'Fire', quality: 'Cardinal', dates: 'Mar 21 - Apr 19' },
    { name: 'Taurus', symbol: '♉', element: 'Earth', quality: 'Fixed', dates: 'Apr 20 - May 20' },
    { name: 'Gemini', symbol: '♊', element: 'Air', quality: 'Mutable', dates: 'May 21 - Jun 20' },
    { name: 'Cancer', symbol: '♋', element: 'Water', quality: 'Cardinal', dates: 'Jun 21 - Jul 22' },
    { name: 'Leo', symbol: '♌', element: 'Fire', quality: 'Fixed', dates: 'Jul 23 - Aug 22' },
    { name: 'Virgo', symbol: '♍', element: 'Earth', quality: 'Mutable', dates: 'Aug 23 - Sep 22' },
    { name: 'Libra', symbol: '♎', element: 'Air', quality: 'Cardinal', dates: 'Sep 23 - Oct 22' },
    { name: 'Scorpio', symbol: '♏', element: 'Water', quality: 'Fixed', dates: 'Oct 23 - Nov 21' },
    { name: 'Sagittarius', symbol: '♐', element: 'Fire', quality: 'Mutable', dates: 'Nov 22 - Dec 21' },
    { name: 'Capricorn', symbol: '♑', element: 'Earth', quality: 'Cardinal', dates: 'Dec 22 - Jan 19' },
    { name: 'Aquarius', symbol: '♒', element: 'Air', quality: 'Fixed', dates: 'Jan 20 - Feb 18' },
    { name: 'Pisces', symbol: '♓', element: 'Water', quality: 'Mutable', dates: 'Feb 19 - Mar 20' },
  ],

  MOON_SIGNS: [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ],

  RISING_SIGNS: [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ],

  /**
   * 计算太阳星座（基于出生日期）
   */
  getSunSign(month, day) {
    const dates = [
      [1, 20], [2, 19], [3, 21], [4, 20], [5, 21], [6, 21],
      [7, 23], [8, 23], [9, 23], [10, 23], [11, 22], [12, 22]
    ];
    let index = month - 1;
    if (day >= dates[month - 1][1]) index = month % 12;
    return this.SIGNS[index];
  },

  /**
   * 计算月亮星座（简化算法：基于出生日期+时间）
   * 真实月亮星座需要精确天文计算，这里用日期哈希模拟
   */
  getMoonSign(date, time) {
    const d = new Date(date + 'T' + time);
    const daysSinceEpoch = Math.floor(d.getTime() / 86400000);
    // 月亮约27.3天走完一圈，每天约13.2°
    const moonLongitude = (daysSinceEpoch * 13.2) % 360;
    const index = Math.floor(moonLongitude / 30);
    return this.SIGNS[index];
  },

  /**
   * 计算上升星座（基于出生时间+地点）
   * 简化算法：上升星座每2小时换一个
   */
  getRisingSign(time, city) {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    // 城市经度修正（简化）
    const cityOffsets = {
      'new_york': -5, 'los_angeles': -8, 'london': 0, 'tokyo': 9,
      'shanghai': 8, 'seoul': 9, 'sydney': 11, 'toronto': -5
    };
    const offset = cityOffsets[city] || 0;
    const adjustedMinutes = (totalMinutes + offset * 60 + 1440) % 1440;
    // 每120分钟一个星座
    const index = Math.floor(adjustedMinutes / 120) % 12;
    return this.SIGNS[index];
  },

  /**
   * 获取完整的本命星盘
   */
  getNatalChart(birthDate, birthTime, birthCity) {
    const [year, month, day] = birthDate.split('-').map(Number);
    const sun = this.getSunSign(month, day);
    const moon = this.getMoonSign(birthDate, birthTime);
    const rising = this.getRisingSign(birthTime, birthCity);

    // 计算主导元素
    const elements = [sun.element, moon.element, rising.element];
    const elementCount = {};
    elements.forEach(e => elementCount[e] = (elementCount[e] || 0) + 1);
    const dominantElement = Object.entries(elementCount).sort((a, b) => b[1] - a[1])[0][0];

    // 生成行星位置（简化模拟）
    const planets = this._generatePlanets(birthDate, birthTime);

    // 生成相位
    const aspects = this._generateAspects(planets);

    return { sun, moon, rising, dominantElement, planets, aspects };
  },

  _generatePlanets(date, time) {
    const d = new Date(date + 'T' + time);
    const seed = d.getTime();
    const planets = [
      { name: 'Mercury', symbol: '☿' },
      { name: 'Venus', symbol: '♀' },
      { name: 'Mars', symbol: '♂' },
      { name: 'Jupiter', symbol: '♃' },
      { name: 'Saturn', symbol: '♄' },
    ];
    return planets.map((p, i) => {
      const hash = ((seed * (i + 1) * 9301 + 49297) % 233280) / 233280;
      const signIndex = Math.floor(hash * 12);
      return { ...p, sign: this.SIGNS[signIndex], degree: Math.floor(hash * 30) };
    });
  },

  _generateAspects(planets) {
    const aspectTypes = [
      { name: 'conjunction', symbol: '☌', angle: 0 },
      { name: 'trine', symbol: '△', angle: 120 },
      { name: 'square', symbol: '□', angle: 90 },
      { name: 'sextile', symbol: '⚹', angle: 60 },
      { name: 'opposition', symbol: '☍', angle: 180 },
    ];
    // 随机选2-3个相位
    const aspects = [];
    for (let i = 0; i < planets.length && aspects.length < 3; i++) {
      for (let j = i + 1; j < planets.length && aspects.length < 3; j++) {
        const aspect = aspectTypes[Math.floor(Math.random() * aspectTypes.length)];
        aspects.push({
          planet1: planets[i].name,
          planet2: planets[j].name,
          type: aspect.name,
          symbol: aspect.symbol,
        });
      }
    }
    return aspects;
  },

  /**
   * 紫微斗数简化排盘（基于农历生日）
   */
  getZiweiChart(birthDate) {
    const d = new Date(birthDate);
    const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);

    const mainStars = [
      '紫微', '天机', '太阳', '武曲', '天同', '廉贞',
      '天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'
    ];

    const starIndex = dayOfYear % mainStars.length;
    const mainStar = mainStars[starIndex];

    const palaces = [
      '命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄',
      '迁移', '交友', '官禄', '田宅', '福德', '父母'
    ];

    return {
      mainStar,
      lifePalace: palaces[dayOfYear % 12],
      careerPalace: palaces[(dayOfYear + 8) % 12],
      wealthPalace: palaces[(dayOfYear + 4) % 12],
      allStars: mainStars,
    };
  },
};
