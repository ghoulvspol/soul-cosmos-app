/**
 * Soul Cosmos - KEPA 自我进化引擎
 * 不更新模型权重，只更新"怎么用模型"的策略
 *
 * 核心流程：
 * 1. 收集反馈 → 2. 分析失败模式 → 3. 调整 Agent 权重 → 4. 更新融合策略
 */
const db = require('./db');

// 默认 Agent 权重
const DEFAULT_AGENTS = [
  { name: 'bazi', dimension: 'overall', weight: 1.0 },
  { name: 'bazi', dimension: 'career', weight: 1.0 },
  { name: 'bazi', dimension: 'marriage', weight: 1.0 },
  { name: 'bazi', dimension: 'health', weight: 1.0 },
  { name: 'astrology', dimension: 'overall', weight: 1.0 },
  { name: 'astrology', dimension: 'personality', weight: 1.0 },
  { name: 'astrology', dimension: 'relationship', weight: 1.0 },
  { name: 'ziwei', dimension: 'overall', weight: 1.0 },
  { name: 'ziwei', dimension: 'career', weight: 1.0 },
  { name: 'ziwei', dimension: 'marriage', weight: 1.0 },
  { name: 'mbti', dimension: 'overall', weight: 1.0 },
  { name: 'mbti', dimension: 'personality', weight: 1.0 },
  { name: 'iching', dimension: 'overall', weight: 1.0 },
  { name: 'psychology', dimension: 'overall', weight: 1.0 },
];

/**
 * 初始化用户 Agent 权重（首次使用时）
 */
function initUserWeights(userId) {
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM agent_weights WHERE user_id = ?').get(userId);
  if (existing.cnt > 0) return;

  const insert = db.prepare(
    'INSERT OR IGNORE INTO agent_weights (user_id, agent_name, dimension, weight) VALUES (?, ?, ?, ?)'
  );
  const insertMany = db.transaction((uid) => {
    for (const a of DEFAULT_AGENTS) {
      insert.run(uid, a.name, a.dimension, a.weight);
    }
  });
  insertMany(userId);
}

/**
 * 记录反馈并更新权重
 * @param {number} userId
 * @param {string} feedbackType - 'accurate' | 'inaccurate'
 * @param {string} insightType - 'profile' | 'career' | 'marriage' | 'health' | etc.
 */
function recordFeedback(userId, feedbackType, insightType) {
  initUserWeights(userId);

  // 根据反馈类型映射到受影响的 Agent
  const affectedAgents = mapInsightToAgents(insightType);

  const updateWeight = db.prepare(`
    UPDATE agent_weights
    SET weight = weight + ?,
        accurate_count = accurate_count + ?,
        inaccurate_count = inaccurate_count + ?,
        last_updated = CURRENT_TIMESTAMP
    WHERE user_id = ? AND agent_name = ? AND dimension = ?
  `);

  const updateMany = db.transaction(() => {
    for (const agentName of affectedAgents) {
      const delta = feedbackType === 'accurate' ? 0.05 : -0.08;
      const accDelta = feedbackType === 'accurate' ? 1 : 0;
      const inaccDelta = feedbackType === 'inaccurate' ? 1 : 0;

      // 更新 overall 维度
      updateWeight.run(delta, accDelta, inaccDelta, userId, agentName, 'overall');

      // 更新具体维度
      if (insightType !== 'profile') {
        updateWeight.run(delta * 0.5, accDelta, inaccDelta, userId, agentName, insightType);
      }
    }
  });
  updateMany();

  // 每 10 次反馈触发一次审查
  const totalFeedback = db.prepare(
    'SELECT COUNT(*) as cnt FROM feedback_memory WHERE user_id = ?'
  ).get(userId);
  if (totalFeedback.cnt % 10 === 0) {
    runReview(userId);
  }
}

/**
 * 将洞察类型映射到受影响的 Agent 列表
 */
function mapInsightToAgents(insightType) {
  const map = {
    profile: ['bazi', 'astrology', 'ziwei', 'mbti', 'iching'],
    career: ['bazi', 'ziwei', 'astrology'],
    marriage: ['bazi', 'ziwei', 'astrology'],
    relationship: ['astrology', 'mbti', 'ziwei'],
    health: ['bazi', 'astrology'],
    personality: ['mbti', 'astrology', 'ziwei'],
    daily: ['astrology', 'iching', 'bazi'],
    compatibility: ['astrology', 'mbti', 'ziwei', 'bazi'],
  };
  return map[insightType] || map.profile;
}

/**
 * 运行 KEPA 后台审查
 */
function runReview(userId) {
  const findings = [];
  const actions = [];

  // 1. 检查各 Agent 的准确率
  const agents = db.prepare(
    'SELECT agent_name, dimension, weight, accurate_count, inaccurate_count FROM agent_weights WHERE user_id = ?'
  ).all(userId);

  for (const agent of agents) {
    const total = agent.accurate_count + agent.inaccurate_count;
    if (total < 3) continue; // 样本不足

    const accuracy = agent.accurate_count / total;

    // 准确率低于 40% → 大幅降权
    if (accuracy < 0.4) {
      const oldWeight = agent.weight;
      const newWeight = Math.max(0.3, oldWeight - 0.15);
      db.prepare('UPDATE agent_weights SET weight = ? WHERE user_id = ? AND agent_name = ? AND dimension = ?')
        .run(newWeight, userId, agent.agent_name, agent.dimension);
      findings.push(`${agent.agent_name}/${agent.dimension}: accuracy ${(accuracy * 100).toFixed(0)}% → weight ${oldWeight.toFixed(2)} → ${newWeight.toFixed(2)}`);
      actions.push(`降权: ${agent.agent_name}/${agent.dimension} -15%`);
    }
    // 准确率高于 70% → 小幅升权
    else if (accuracy > 0.7 && agent.weight < 1.5) {
      const oldWeight = agent.weight;
      const newWeight = Math.min(1.5, oldWeight + 0.03);
      db.prepare('UPDATE agent_weights SET weight = ? WHERE user_id = ? AND agent_name = ? AND dimension = ?')
        .run(newWeight, userId, agent.agent_name, agent.dimension);
      findings.push(`${agent.agent_name}/${agent.dimension}: accuracy ${(accuracy * 100).toFixed(0)}% → weight ${oldWeight.toFixed(2)} → ${newWeight.toFixed(2)}`);
      actions.push(`升权: ${agent.agent_name}/${agent.dimension} +3%`);
    }
  }

  // 2. 遗忘机制：清理低价值反馈
  const cutoffDate = new Date(Date.now() - 30 * 86400000).toISOString();
  const oldFeedback = db.prepare(
    'SELECT id FROM feedback_memory WHERE user_id = ? AND created_at < ? ORDER BY created_at DESC LIMIT 100'
  ).all(userId, cutoffDate);
  if (oldFeedback.length > 20) {
    // 保留最近的，删除更早的
    const toDelete = oldFeedback.slice(20);
    const del = db.prepare('DELETE FROM feedback_memory WHERE id = ?');
    const delMany = db.transaction(() => { toDelete.forEach(f => del.run(f.id)); });
    delMany();
    findings.push(`遗忘机制: 清理 ${toDelete.length} 条过期反馈`);
    actions.push(`清理: 删除 ${toDelete.length} 条 >30天 反馈`);
  }

  // 3. 记录审查日志
  if (findings.length > 0) {
    db.prepare(
      'INSERT INTO kepa_reviews (user_id, review_type, findings, actions_taken) VALUES (?, ?, ?, ?)'
    ).run(userId, 'auto', JSON.stringify(findings), JSON.stringify(actions));
  }

  return { findings, actions };
}

/**
 * 获取用户个性化融合策略（注入到 AI prompt）
 * @returns {string} 策略文本，用于追加到 system prompt
 */
function getFusionStrategy(userId) {
  if (!userId) return '';

  initUserWeights(userId);

  const agents = db.prepare(
    'SELECT agent_name, dimension, weight FROM agent_weights WHERE user_id = ? AND weight != 1.0 ORDER BY ABS(weight - 1.0) DESC'
  ).all(userId);

  if (agents.length === 0) return '';

  const lines = agents.map(a => {
    const direction = a.weight > 1.0 ? '加权' : '降权';
    const pct = Math.abs((a.weight - 1.0) * 100).toFixed(0);
    return `- ${a.agent_name} (${a.dimension}): ${direction} ${pct}% (用户反馈调整)`;
  });

  return `\n\n## 用户个性化融合策略 (KEPA)\n基于用户历史反馈，以下 Agent 权重已自动调整：\n${lines.join('\n')}\n请在融合分析时参考这些权重调整。`;
}

/**
 * 获取 KEPA 状态摘要（供管理后台使用）
 */
function getStatus(userId) {
  const weights = db.prepare(
    'SELECT agent_name, dimension, weight, accurate_count, inaccurate_count FROM agent_weights WHERE user_id = ?'
  ).all(userId);

  const reviews = db.prepare(
    'SELECT * FROM kepa_reviews WHERE user_id = ? ORDER BY created_at DESC LIMIT 5'
  ).all(userId);

  return { weights, reviews };
}

module.exports = { initUserWeights, recordFeedback, runReview, getFusionStrategy, getStatus };
