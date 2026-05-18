/**
 * Soul Cosmos - Multi-Agent Harness 编排系统（模板优先版）
 *
 * 新逻辑: 本地分析 → 模板匹配 → (兜底: LLM融合)
 * 95%请求命中模板，$0成本
 */
const { callAI } = require('./llm');
const templateEngine = require('./template-engine');

const BUDGET = { total: 6000, green: 0.5, yellow: 0.2, red: 0.05, circuitBreak: 0.0 };

// Agent 注册表（精简版 — 每个 Agent 只输出 1-2 句话）
const AGENTS = {
  bazi: {
    name: '八字 Agent', icon: '📜',
    systemPrompt: 'You are a BaZi master. In 1-2 sentences, analyze the Four Pillars and Day Master. Be specific with element interactions.',
    maxTokens: 150, weight: 1.0,
  },
  astrology: {
    name: '星盘 Agent', icon: '🌌',
    systemPrompt: 'You are an astrology expert. In 1-2 sentences, analyze how sun/moon/rising signs create this person\'s archetype.',
    maxTokens: 150, weight: 1.0,
  },
  ziwei: {
    name: '紫微 Agent', icon: '☯',
    systemPrompt: 'You are a Zi Wei Dou Shu master. In 1-2 sentences, analyze the main star and life palace meaning.',
    maxTokens: 150, weight: 1.0,
  },
  mbti: {
    name: 'MBTI Agent', icon: '🧠',
    systemPrompt: 'You are a MBTI expert. In 1 sentence, describe how the cognitive functions manifest in daily behavior.',
    maxTokens: 100, weight: 1.0,
  },
  iching: {
    name: '易经 Agent', icon: '☯️',
    systemPrompt: 'You are an I Ching master. In 1 sentence, describe what the hexagram reveals about this person\'s life energy.',
    maxTokens: 100, weight: 1.0,
  },
};

const FUSION_AGENT = { name: 'Fusion', icon: '✦', maxTokens: 1200 };
const { generateLocalAnalysis } = require('./local-analysis');

/**
 * 快速编排：模板优先（$0）→ LLM 兜底
 * 95%请求命中模板，本地返回，零API成本
 */
async function orchestrateFast(input, userWeights = {}) {
  const { natalChart, mbtiType, ziweiChart, iching, bazi, lang, gender, birthDate } = input;
  const isZh = lang === 'zh';

  // Phase 1: 本地分析（0ms，纯计算）
  const reasoningSteps = generateLocalAnalysis(input);

  // Phase 2: 构建标签对象
  const tags = {
    bazi: bazi || null,
    natalChart: natalChart || null,
    ziweiChart: ziweiChart || null,
    mbtiType: mbtiType || null,
    iching: iching || null,
    gender: gender || 'unknown',
    birthDate: birthDate || null,
    lang,
  };

  // Phase 3: 模板匹配（新增，优先级最高）
  const result = await templateEngine.matchAndRender(tags, lang);

  return {
    mode: result.mode,
    profile: result.profile,
    matchType: result.matchType,
    reasoningSteps,
    budget: { used: result.mode === 'fallback-llm' ? 1200 : 0, total: BUDGET.total },
    model: result.mode === 'fallback-llm' ? 'llm-fallback' : 'template-local',
  };
}

/**
 * 解析 JSON（4 级降级）
 */
function parseJSON(raw) {
  const cleaned = raw.replace(/^```[\w]*\s*/gim, '').replace(/```\s*$/gim, '').trim();
  try { return JSON.parse(cleaned); } catch {}
  try { const m = cleaned.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0].replace(/,\s*([\]}])/g, '$1')); } catch {}
  try {
    const start = cleaned.indexOf('{');
    if (start >= 0) {
      const partial = cleaned.slice(start);
      let depth = 0, end = 0;
      for (let i = 0; i < partial.length; i++) {
        if (partial[i] === '{') depth++;
        if (partial[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
      }
      if (end > 0) return JSON.parse(partial.slice(0, end));
      let t = partial.replace(/,?\s*"[^"]*":\s*"[^"]*$/, '').replace(/,?\s*"[^"]*":\s*\[[^\]]*$/, '');
      const ob = (t.match(/\{/g)||[]).length, cb = (t.match(/\}/g)||[]).length;
      const obr = (t.match(/\[/g)||[]).length, cbr = (t.match(/\]/g)||[]).length;
      for (let i=0;i<obr-cbr;i++) t+=']';
      for (let i=0;i<ob-cb;i++) t+='}';
      return JSON.parse(t.replace(/,\s*([\]}])/g, '$1'));
    }
  } catch {}
  return null;
}

/**
 * 标准编排：并行 Agent → 融合引擎（10秒出结果，更完整）
 */
async function orchestrate(input, userWeights = {}) {
  const { natalChart, mbtiType, ziweiChart, iching, bazi, lang, gender, birthDate } = input;
  const budget = { used: 0, total: BUDGET.total };
  const weights = { ...getDefaultWeights(), ...userWeights };

  const agentNames = [];
  const agentTasks = [];

  if (bazi) { agentNames.push('bazi'); agentTasks.push(runAgent('bazi', formatBaziInput(bazi), lang, budget, weights.bazi)); }
  if (natalChart) { agentNames.push('astrology'); agentTasks.push(runAgent('astrology', formatAstrologyInput(natalChart), lang, budget, weights.astrology)); }
  if (ziweiChart) { agentNames.push('ziwei'); agentTasks.push(runAgent('ziwei', formatZiweiInput(ziweiChart), lang, budget, weights.ziwei)); }
  if (mbtiType) { agentNames.push('mbti'); agentTasks.push(runAgent('mbti', `MBTI Type: ${mbtiType}`, lang, budget, weights.mbti)); }
  if (iching) { agentNames.push('iching'); agentTasks.push(runAgent('iching', formatIchingInput(iching), lang, budget, weights.iching)); }

  const settled = await Promise.allSettled(agentTasks);
  const results = {};
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value) results[agentNames[i]] = r.value;
  });

  // Phase 2: 融合
  if (getBudgetLevel(budget) === 'circuitBreak') {
    return { error: 'Budget exhausted', partial: results };
  }
  const fusionResult = await runFusion(results, lang, budget);
  const reasoningSteps = buildReasoningSteps(results, bazi, natalChart, ziweiChart, iching, mbtiType, lang === 'zh');

  return {
    mode: 'standard',
    profile: fusionResult,
    reasoningSteps,
    agentResults: results,
    budget: { used: budget.used, total: budget.total },
    model: 'xiaomi/mimo-v2.5-pro',
  };
}

/**
 * 运行单个 Agent（精简 prompt，最少 token）
 */
async function runAgent(name, input, lang, budget, weightOverride) {
  const agent = AGENTS[name];
  if (!agent) return null;
  if (getBudgetLevel(budget) === 'circuitBreak') return null;

  const maxTokens = agent.maxTokens; // 100-150 tokens
  const L = lang === 'zh' ? 'Chinese' : 'English';

  try {
    const result = await callAI([
      { role: 'system', content: `${agent.systemPrompt} Reply in ${L}. Be concise.` },
      { role: 'user', content: input },
    ], maxTokens);

    budget.used += maxTokens;
    return { conclusion: result.trim(), confidence: weightOverride || agent.weight };
  } catch (err) {
    console.warn(`Agent ${name} failed:`, err.message);
    return null;
  }
}

/**
 * 从 Agent 结果组装 reasoningSteps（无额外 API 调用）
 */
function buildReasoningSteps(results, bazi, natalChart, ziweiChart, iching, mbtiType, isZh) {
  const steps = [];

  if (results.bazi) steps.push({
    system: isZh ? '八字命理' : 'BaZi (八字)', icon: '📜',
    input: bazi?.fourPillars || '', reasoning: results.bazi.conclusion, conclusion: '',
  });
  if (results.astrology) steps.push({
    system: isZh ? '西方星盘' : 'Western Astrology', icon: '🌌',
    input: natalChart ? `${natalChart.sun.name}/${natalChart.moon.name}/${natalChart.rising.name}` : '',
    reasoning: results.astrology.conclusion, conclusion: '',
  });
  if (results.ziwei) steps.push({
    system: isZh ? '紫微斗数' : 'Zi Wei Dou Shu', icon: '☯',
    input: ziweiChart?.mainStar || '', reasoning: results.ziwei.conclusion, conclusion: '',
  });
  if (results.iching) steps.push({
    system: isZh ? '易经' : 'I Ching', icon: '☯️',
    input: iching ? `${iching.number}. ${iching.name}` : '', reasoning: results.iching.conclusion, conclusion: '',
  });
  if (results.mbti) steps.push({
    system: 'MBTI', icon: '🧠',
    input: mbtiType || '', reasoning: results.mbti.conclusion, conclusion: '',
  });

  return steps;
}

/**
 * 融合引擎（精简版 — 减少 token 输出）
 */
async function runFusion(agentResults, lang, budget) {
  const L = lang === 'zh' ? 'Chinese' : 'English';
  const maxTokens = FUSION_AGENT.maxTokens; // 1200

  const agentSummaries = Object.entries(agentResults)
    .map(([name, r]) => `[${name}] ${r.conclusion}`)
    .join('\n');

  const systemPrompt = `You are a personality analyst. Fuse these system analyses into ONE soul portrait.
Reply in ${L}. Keep text fields brief (1-2 sentences each). Output ONLY valid JSON:
{
  "soulKeywords": ["k1", "k2", "k3", "k4"],
  "oneSentencePortrait": "poetic sentence",
  "coreTraits": [{"trait": "Name", "description": "2 sentences"}],
  "shadows": [{"challenge": "Name", "description": "2 sentences"}],
  "lifeTheme": "2 sentences",
  "dailyInsight": "2 sentences",
  "marriageFortune": "2 sentences",
  "careerGuidance": "2 sentences",
  "healthAdvice": "2 sentences",
  "annualFortune": "2 sentences",
  "luckyElements": {"colors": [], "numbers": [], "direction": "", "day": ""}
}`;

  const result = await callAI([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Agent Results:\n${agentSummaries}\n\nFuse into one portrait. Be specific to this person.` },
  ], maxTokens);

  budget.used += maxTokens;

  // 解析 JSON
  try {
    let cleaned = result.replace(/^```[\w]*\s*/gim, '').replace(/```\s*$/gim, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {}
  return null;
}

// 工具函数
function getDefaultWeights() {
  return Object.fromEntries(Object.entries(AGENTS).map(([k, v]) => [k, v.weight]));
}

function getBudgetLevel(budget) {
  const ratio = (budget.total - budget.used) / budget.total;
  if (ratio <= BUDGET.circuitBreak) return 'circuitBreak';
  if (ratio <= BUDGET.red) return 'red';
  if (ratio <= BUDGET.yellow) return 'yellow';
  return 'green';
}

function formatBaziInput(bazi) {
  return `BaZi Four Pillars: ${bazi.fourPillars || ''}
Day Master: ${bazi.riZhu || ''}
Pattern: ${bazi.geJu || ''}
Five Elements: ${JSON.stringify(bazi.wuXing || {})}`;
}

function formatAstrologyInput(chart) {
  return `Sun: ${chart.sun?.name} (${chart.sun?.element}, ${chart.sun?.quality})
Moon: ${chart.moon?.name} (${chart.moon?.element})
Rising: ${chart.rising?.name} (${chart.rising?.element})
Dominant Element: ${chart.dominantElement}`;
}

function formatZiweiInput(chart) {
  return `Main Star: ${chart.mainStar}
Life Palace: ${chart.lifePalace}
Career Palace: ${chart.careerPalace}`;
}

function formatIchingInput(iching) {
  return `Hexagram ${iching.number}: ${iching.name} (${iching.english})
Upper: ${iching.upperTrigram}, Lower: ${iching.lowerTrigram}
Judgment: ${iching.judgment || iching.judgmentEn}
Keywords: ${(iching.keywords || []).join(', ')}`;
}

module.exports = { orchestrate, orchestrateFast, AGENTS, BUDGET };
