// server/template-db.js
const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, 'templates');
const DATA_DIR = path.join(__dirname, 'data');

class TemplateDB {
  constructor() {
    this.profiles = {};
    this.daily = {};
    this.weekly = {};
    this.monthly = {};
  }

  load() {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.mkdirSync(TEMPLATES_DIR, { recursive: true });

    this._loadFile('seed-profiles.json', this.profiles, 'profiles');
    this._loadFile('seed-daily.json', this.daily, 'daily');
    this._loadFile('seed-weekly.json', this.weekly, 'weekly');
    this._loadFile('seed-monthly.json', this.monthly, 'monthly');

    const learnedPath = path.join(DATA_DIR, 'learned-profiles.json');
    if (fs.existsSync(learnedPath)) {
      this._loadFile(learnedPath, this.profiles, 'learned');
    }

    console.log(`[TemplateDB] Loaded ${Object.keys(this.profiles).length} profiles, ${Object.keys(this.daily).length} daily`);
  }

  _loadFile(filename, target, label) {
    let filepath = filename;
    if (!path.isAbsolute(filename)) {
      filepath = path.join(TEMPLATES_DIR, filename);
    }
    if (!fs.existsSync(filepath)) {
      console.log(`[TemplateDB] ${label}: file not found (${filename}), skipping`);
      return;
    }
    try {
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      if (Array.isArray(data)) {
        data.forEach(item => {
          // daily/weekly/monthly 模板用 tags 做 key，profile 模板用 fingerprint
          const key = item.fingerprint
            ? this._fingerprintKey(item.fingerprint)
            : (item.tags || []).join('|');
          target[key] = item;
        });
      }
      console.log(`[TemplateDB] ${label}: loaded ${data.length} entries`);
    } catch (err) {
      console.error(`[TemplateDB] Failed to load ${filename}:`, err.message);
    }
  }

  findExact(fingerprint) {
    const key = this._fingerprintKey(fingerprint);
    return this.profiles[key] || null;
  }

  getAll() {
    return Object.values(this.profiles);
  }

  save(fingerprint, result) {
    const key = this._fingerprintKey(fingerprint);
    const template = {
      id: `learned_${Date.now()}`,
      fingerprint,
      en: result,
      zh: result,
      createdAt: new Date().toISOString(),
    };
    this.profiles[key] = template;

    const learned = Object.values(this.profiles).filter(t => t.id.startsWith('learned_'));
    fs.writeFile(
      path.join(DATA_DIR, 'learned-profiles.json'),
      JSON.stringify(learned, null, 2),
      () => {}
    );
  }

  getGeneric(lang) {
    if (lang === 'zh') {
      return {
        whoYouAre: '你是一个独一无二的存在——复杂而完整，柔软而坚韧。不必急于定义自己，你的每一面都在告诉你同一个秘密：你比你想象的更完整。',
        howYouLove: '你爱得深沉而不说出口。你给予的是稳固的陪伴，渴望的是被真正懂得。当有人能读懂你的沉默时，那就是你的归属。',
        whereYouThrive: '你的天赋在于你能看到别人忽略的连接。在创造、构思、搭建新事物的时候，你是最闪亮的。不要让别人告诉你"应该"走哪条路。',
        yourShadows: '你太想照顾所有人，常常忘了自己也需要被照顾。学会说"我需要帮助"并不丢人。你的独立是一种力量，但偶尔的脆弱让它更真实。',
        yourSeason: '你正处在一个过渡期——旧的事正在褪色，新的还没完全显现。这不是空白，是孕育。整理好旧的行囊，准备迎接新的开始。',
        theFullPicture: '你是一团平静的火——表面安稳，内心燃烧。世界需要你的那份沉稳，也需要你偶尔放出的炽热。',
      };
    }
    return {
      whoYouAre: "You're a quiet contradiction — soft and fierce, grounded and restless. Don't rush to define yourself. Every layer of you whispers the same truth: you're more whole than you think.",
      howYouLove: "You love deeply and silently. What you offer is steady presence. What you crave is being truly understood. When someone can read your silence, you've found home.",
      whereYouThrive: "Your gift is seeing connections others miss. You shine brightest when creating, imagining, building something new. Don't let anyone else write your map.",
      yourShadows: "You carry everyone — and forget to carry yourself. Learning to say 'I need help' isn't weakness. Your independence is strength, but your vulnerability makes it real.",
      yourSeason: "You're in a passage — old things fading, new not yet visible. This isn't emptiness. It's gestation. Pack your old bags, get ready for what's coming.",
      theFullPicture: "A quiet fire — steady on the outside, burning within. The world needs your groundedness. And your occasional wild release.",
    };
  }

  matchDaily(tags, gender) {
    const key = [tags.transits?.[0], tags.dailyZiwei?.palace].filter(Boolean).join('|');
    return this.daily[key] || this._getDefaultDaily();
  }

  _getDefaultDaily() {
    const defaults = [
      { zh: '今天一切如常，但如常也是一种礼物。做一件让你嘴角上扬的小事。',
        en: 'Today is ordinary — and ordinary is a gift. Do one small thing that makes you smile.' },
      { zh: '今天适合放慢脚步。不需要推动任何事情，让事情自然发生。',
        en: 'Slow down today. Nothing needs to be pushed. Let things unfold.' },
      { zh: '今天的你比别人更敏锐。信任你的直觉，它会带你去对的地方。',
        en: 'Your intuition is sharper than usual today. Trust where it leads you.' },
    ];
    return defaults[Math.floor(Math.random() * defaults.length)];
  }

  _fingerprintKey(fp) {
    return [
      fp.riZhuWuXing,
      fp.sunSign,
      fp.mainStar,
      fp.mbti,
      fp.gender,
      fp.dominantElement,
    ].map(v => v || '?').join('|');
  }
}

module.exports = new TemplateDB();
