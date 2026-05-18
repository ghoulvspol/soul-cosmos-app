// server/scripts/generate-tag-combinations.js
const fs = require('fs');
const path = require('path');

const WU_XING = ['金', '木', '水', '火', '土'];
const SUN_SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const ZIWEI_STARS = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'];
const MBTI_TYPES = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'];
const GENDERS = ['male', 'female'];
const ELEMENTS = ['Fire', 'Earth', 'Air', 'Water'];
const YIN_YANG = ['阳', '阴'];
const GE_JUS = ['建禄格', '食神格', '正印格', '正财格', '正官格', '伤官配印', '伤官格', '偏财格', '偏官格', '偏印格', '比劫格', '杂气格'];

function generateCombinations(count = 5000) {
  const results = [];
  const used = new Set();

  for (let i = 0; i < count; i++) {
    let combo;
    let key;
    do {
      const wx = WU_XING[Math.floor(Math.random() * WU_XING.length)];
      const yy = YIN_YANG[Math.floor(Math.random() * YIN_YANG.length)];
      const sun = SUN_SIGNS[Math.floor(Math.random() * SUN_SIGNS.length)];
      const moon = SUN_SIGNS[Math.floor(Math.random() * SUN_SIGNS.length)];
      const star = ZIWEI_STARS[Math.floor(Math.random() * ZIWEI_STARS.length)];
      const mbti = MBTI_TYPES[Math.floor(Math.random() * MBTI_TYPES.length)];
      const gender = GENDERS[Math.floor(Math.random() * GENDERS.length)];
      const element = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
      const hex = Math.floor(Math.random() * 64) + 1;
      const geju = GE_JUS[Math.floor(Math.random() * GE_JUS.length)];
      const wxDom = WU_XING[Math.floor(Math.random() * WU_XING.length)];
      const wxLack = WU_XING.filter(w => w !== wxDom)[Math.floor(Math.random() * 4)];

      key = `${wx}|${sun}|${star}|${mbti}|${gender}`;
      combo = {
        id: `seed_${String(i).padStart(4, '0')}`,
        tags: {
          riZhuWuXing: wx,
          riZhuYinYang: yy,
          geJu: geju,
          wuXingDominant: wxDom,
          wuXingLack: wxLack,
          sunSign: sun,
          moonSign: moon,
          dominantElement: element,
          mainStar: star,
          hexagramNumber: hex,
          mbti: mbti,
          gender: gender,
        },
      };
    } while (used.has(key));
    used.add(key);
    results.push(combo);
  }
  return results;
}

const outDir = path.join(__dirname, '..', 'templates');
fs.mkdirSync(outDir, { recursive: true });

const combos = generateCombinations(5000);
const outPath = path.join(outDir, 'tag-combinations.json');
fs.writeFileSync(outPath, JSON.stringify(combos, null, 2));
console.log(`Generated ${combos.length} unique tag combinations → ${outPath}`);
