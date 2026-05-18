const templateDB = require('../template-db');
templateDB.load();
console.log('Total profiles:', Object.keys(templateDB.profiles).length);

const engine = require('../template-engine');
const WU_XING = ['金','木','水','火','土'];
const SUN_SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const ZIWEI = ['紫微','天机','太阳','武曲','天同','廉贞','天府','太阴','贪狼','巨门','天相','天梁','七杀','破军'];
const MBTI = ['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'];
const ELEMENTS = ['Fire','Earth','Air','Water'];

(async () => {
  let exact = 0, degraded = 0, fallback = 0;
  const total = 30;
  for (let i = 0; i < total; i++) {
    const wx = WU_XING[i % 5];
    const sun = SUN_SIGNS[i % 12];
    const star = ZIWEI[i % 14];
    const mbti = MBTI[i % 16];
    const el = ELEMENTS[i % 4];
    const tags = {
      bazi: { riZhuWuXing: wx, riZhuYinYang: i % 2 === 0 ? '阳' : '阴', geJu: '伤官配印', wuXing: { dominant: wx, lack: '水' } },
      natalChart: { sun: { name: sun }, moon: { name: 'Cancer' }, dominantElement: el },
      ziweiChart: { mainStar: star },
      mbtiType: mbti,
      gender: i % 2 === 0 ? 'male' : 'female',
      iching: { number: (i % 64) + 1 },
      birthDate: '1990-01-01',
    };
    const r = await engine.matchAndRender(tags, 'zh');
    if (r.matchType === 'exact') exact++;
    else if (r.matchType === 'degraded') degraded++;
    else fallback++;
  }
  console.log(`\n=== ${total} 次随机测试 ===`);
  console.log(`精确匹配: ${exact} (${(exact/total*100).toFixed(0)}%)`);
  console.log(`降级匹配: ${degraded} (${(degraded/total*100).toFixed(0)}%)`);
  console.log(`LLM兜底: ${fallback} (${(fallback/total*100).toFixed(0)}%)`);
  console.log(`模板覆盖: ${((exact+degraded)/total*100).toFixed(0)}%`);
})();
