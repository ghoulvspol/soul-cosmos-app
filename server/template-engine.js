// server/template-engine.js
const templateDB = require('./template-db');
const { callAI } = require('./llm');

const templateEngine = {
  async matchAndRender(tags, lang) {
    const fp = this.buildFingerprint(tags);

    // Level 1: 精确匹配
    let template = templateDB.findExact(fp);
    if (template) {
      console.log(`[Template] Exact match: ${template.id}`);
      return {
        mode: 'template',
        profile: this.renderTemplate(template, lang),
        matchType: 'exact',
      };
    }

    // Level 2: 降级匹配
    template = this.degradationMatch(fp);
    if (template) {
      console.log(`[Template] Degradation match: ${template.id} (score: ${template._score})`);
      return {
        mode: 'template',
        profile: this.renderTemplate(template, lang),
        matchType: 'degraded',
        matchScore: template._score,
      };
    }

    // Level 3: 兜底 LLM
    console.log('[Template] No match, falling back to LLM');
    try {
      const llmResult = await this.callLLMFallback(tags, lang);
      templateDB.save(fp, llmResult);
      return {
        mode: 'fallback-llm',
        profile: llmResult,
        matchType: 'new',
      };
    } catch (err) {
      console.error('[Template] LLM fallback failed:', err.message);
      return {
        mode: 'fallback-generic',
        profile: templateDB.getGeneric(lang),
        matchType: 'generic',
      };
    }
  },

  /**
   * 降级匹配算法
   * 权重排序:
   *   1. riZhuWuXing + sunSign = 30 each
   *   2. mainStar + mbti       = 25 each
   *   3. gender + dominantElement = 20 each
   *   4. riZhuYinYang + geJu   = 15 each
   *   5. wuXingDominant + hexagramNumber = 10 each
   *   6. moonSign + wuXingLack = 5 each
   */
  degradationMatch(fp) {
    const allTemplates = templateDB.getAll();
    if (allTemplates.length === 0) return null;

    const scored = allTemplates.map(t => {
      let score = 0;
      const tfp = t.fingerprint;

      if (tfp.riZhuWuXing === fp.riZhuWuXing) score += 30;
      if (tfp.sunSign === fp.sunSign) score += 30;
      if (tfp.mainStar === fp.mainStar) score += 25;
      if (tfp.mbti === fp.mbti) score += 25;
      if (tfp.gender === fp.gender) score += 20;
      if (tfp.dominantElement === fp.dominantElement) score += 20;
      if (tfp.riZhuYinYang === fp.riZhuYinYang) score += 15;
      if (tfp.geJu === fp.geJu) score += 15;
      if (tfp.wuXingDominant === fp.wuXingDominant) score += 10;
      if (tfp.hexagramNumber === fp.hexagramNumber) score += 10;
      if (tfp.moonSign === fp.moonSign) score += 5;
      if (tfp.wuXingLack === fp.wuXingLack) score += 5;

      return { template: t, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];

    // 总分 220，60% = 132
    if (best.score >= 132) {
      best.template._score = best.score;
      return best.template;
    }

    return null;
  },

  buildFingerprint(tags) {
    return {
      riZhuWuXing: tags.bazi?.riZhuWuXing || null,
      riZhuYinYang: tags.bazi?.riZhuYinYang || null,
      geJu: tags.bazi?.geJu || null,
      wuXingDominant: tags.bazi?.wuXing?.dominant || null,
      wuXingLack: tags.bazi?.wuXing?.lack || null,
      sunSign: tags.natalChart?.sun?.name || null,
      moonSign: tags.natalChart?.moon?.name || null,
      risingSign: tags.natalChart?.rising?.name || null,
      dominantElement: tags.natalChart?.dominantElement || null,
      mainStar: tags.ziweiChart?.mainStar || null,
      mbti: tags.mbtiType || null,
      hexagramNumber: tags.iching?.number || null,
      gender: tags.gender || 'unknown',
      ageGroup: tags.birthDate ? this.getAgeGroup(tags.birthDate) : null,
    };
  },

  getAgeGroup(birthDate) {
    const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
    if (age < 20) return 'under-20';
    if (age < 26) return '20-25';
    if (age < 31) return '26-30';
    if (age < 36) return '31-35';
    if (age < 41) return '36-40';
    return 'over-40';
  },

  renderTemplate(template, lang) {
    const localized = template[lang] || template.en;
    return {
      whoYouAre: localized.whoYouAre,
      howYouLove: localized.howYouLove,
      whereYouThrive: localized.whereYouThrive,
      yourShadows: localized.yourShadows,
      yourSeason: localized.yourSeason,
      theFullPicture: localized.theFullPicture,
      soulKeywords: template.soulKeywords || [],
    };
  },

  async callLLMFallback(tags, lang) {
    const { generateLocalAnalysis } = require('./local-analysis');
    const steps = generateLocalAnalysis(tags);
    const agentSummaries = steps.map(s => `[${s.system}] ${s.reasoning}`).join('\n');
    const L = lang === 'zh' ? 'Chinese' : 'English';

    const prompt = `You are a personality analyst. Write a soul portrait in ${L}.
Rules:
- NEVER mention any divination system name
- NEVER use technical terms
- Warm, poetic, personal tone
- 2-3 sentences per field

Output ONLY valid JSON with these 6 fields:
{ "whoYouAre": "...", "howYouLove": "...", "whereYouThrive": "...", "yourShadows": "...", "yourSeason": "...", "theFullPicture": "..." }

Analyses: ${agentSummaries}`;

    const raw = await callAI([
      { role: 'system', content: prompt },
      { role: 'user', content: 'Write the portrait.' },
    ], 1200);

    let cleaned = raw.replace(/^```[\w]*\s*/gim, '').replace(/```\s*$/gim, '').trim();
    try { return JSON.parse(cleaned); } catch {}
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    return templateDB.getGeneric(lang);
  },
};

module.exports = templateEngine;
