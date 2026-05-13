/**
 * Soul Cosmos - 用户数据路由
 * 所有写操作需认证，读操作可选认证
 */
const express = require('express');
const db = require('../db');
const { optionalAuth, requireAuth } = require('../auth');

const router = express.Router();

// ============ 灵魂画像 ============

// 获取用户画像列表
router.get('/profile', optionalAuth, (req, res) => {
  if (!req.user) return res.json({ success: true, profiles: [] });
  const profiles = db.prepare(
    'SELECT id, birth_date, birth_time, birth_city, gender, mbti_type, created_at FROM profiles WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.user.id);
  res.json({ success: true, profiles });
});

// 保存新画像
router.post('/profile', requireAuth, (req, res) => {
  const { birth_date, birth_time, birth_city, gender, mbti_type, natal_chart, ziwei_chart, bazi_data, soul_profile } = req.body;
  if (!birth_date) return res.status(400).json({ success: false, error: 'birth_date required' });

  const result = db.prepare(`
    INSERT INTO profiles (user_id, birth_date, birth_time, birth_city, gender, mbti_type, natal_chart, ziwei_chart, bazi_data, soul_profile)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id, birth_date, birth_time, birth_city, gender, mbti_type,
    natal_chart ? JSON.stringify(natal_chart) : null,
    ziwei_chart ? JSON.stringify(ziwei_chart) : null,
    bazi_data ? JSON.stringify(bazi_data) : null,
    soul_profile ? JSON.stringify(soul_profile) : null
  );
  res.json({ success: true, id: result.lastInsertRowid });
});

// 获取单个画像详情
router.get('/profile/:id', optionalAuth, (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Login required' });
  const profile = db.prepare('SELECT * FROM profiles WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });
  // 解析 JSON 字段
  ['natal_chart', 'ziwei_chart', 'bazi_data', 'soul_profile'].forEach(key => {
    if (profile[key]) profile[key] = JSON.parse(profile[key]);
  });
  res.json({ success: true, profile });
});

// ============ 分析历史 ============

// 获取分析历史（分页）
router.get('/history', optionalAuth, (req, res) => {
  if (!req.user) return res.json({ success: true, analyses: [] });
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;
  const type = req.query.type; // 可选按类型筛选

  let query = 'SELECT id, type, model, created_at FROM analyses WHERE user_id = ?';
  const params = [req.user.id];
  if (type) { query += ' AND type = ?'; params.push(type); }
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const analyses = db.prepare(query).all(...params);
  res.json({ success: true, analyses, limit, offset });
});

// 保存分析记录
router.post('/history', requireAuth, (req, res) => {
  const { type, input_data, result_data, model } = req.body;
  if (!type) return res.status(400).json({ success: false, error: 'type required' });

  const result = db.prepare(
    'INSERT INTO analyses (user_id, type, input_data, result_data, model) VALUES (?, ?, ?, ?, ?)'
  ).run(
    req.user.id, type,
    input_data ? JSON.stringify(input_data) : null,
    result_data ? JSON.stringify(result_data) : null,
    model
  );
  res.json({ success: true, id: result.lastInsertRowid });
});

// 获取单条历史详情
router.get('/history/:id', requireAuth, (req, res) => {
  const analysis = db.prepare('SELECT * FROM analyses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!analysis) return res.status(404).json({ success: false, error: 'Analysis not found' });
  ['input_data', 'result_data'].forEach(key => {
    if (analysis[key]) analysis[key] = JSON.parse(analysis[key]);
  });
  res.json({ success: true, analysis });
});

// ============ 反馈记忆 ============

// 保存反馈（触发 KEPA 权重调整）
router.post('/feedback', requireAuth, (req, res) => {
  const { analysis_id, feedback_type, insight_type, content } = req.body;
  if (!feedback_type) return res.status(400).json({ success: false, error: 'feedback_type required' });

  const result = db.prepare(
    'INSERT INTO feedback_memory (user_id, analysis_id, feedback_type, insight_type, content) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user.id, analysis_id || null, feedback_type, insight_type, content || null);

  // KEPA: 记录反馈并调整 Agent 权重
  if (feedback_type === 'accurate' || feedback_type === 'inaccurate') {
    try {
      const kepa = require('../kepa');
      kepa.recordFeedback(req.user.id, feedback_type, insight_type || 'profile');
    } catch (err) {
      console.warn('KEPA feedback error:', err.message);
    }
  }

  res.json({ success: true, id: result.lastInsertRowid });
});

// 获取用户反馈历史
router.get('/feedback', requireAuth, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const feedbacks = db.prepare(
    'SELECT * FROM feedback_memory WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
  ).all(req.user.id, limit);
  res.json({ success: true, feedbacks });
});

// ============ 我的圈子 ============

// 获取圈子成员
router.get('/circle', optionalAuth, (req, res) => {
  if (!req.user) return res.json({ success: true, members: [] });
  const members = db.prepare(
    'SELECT * FROM circle_members WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.user.id);
  members.forEach(m => {
    if (m.zodiac_data) m.zodiac_data = JSON.parse(m.zodiac_data);
    if (m.profile_data) m.profile_data = JSON.parse(m.profile_data);
  });
  res.json({ success: true, members });
});

// 添加圈子成员
router.post('/circle', requireAuth, (req, res) => {
  const { name, relation, birth_date, birth_time, mbti_type, zodiac_data } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'name required' });

  const result = db.prepare(
    'INSERT INTO circle_members (user_id, name, relation, birth_date, birth_time, mbti_type, zodiac_data) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    req.user.id, name, relation, birth_date, birth_time, mbti_type,
    zodiac_data ? JSON.stringify(zodiac_data) : null
  );
  res.json({ success: true, id: result.lastInsertRowid });
});

// 删除圈子成员
router.delete('/circle/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM circle_members WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ success: false, error: 'Member not found' });
  res.json({ success: true });
});

// ============ 数据迁移（localStorage → 服务端）============

// 批量迁移 localStorage 数据
router.post('/migrate', requireAuth, (req, res) => {
  const { circle, feedback } = req.body;
  const migrated = { circle: 0, feedback: 0 };

  if (Array.isArray(circle)) {
    const insert = db.prepare(
      'INSERT INTO circle_members (user_id, name, relation, birth_date, mbti_type, zodiac_data) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const insertMany = db.transaction((items) => {
      for (const item of items) {
        insert.run(
          req.user.id, item.name, item.relation, item.birthDate, item.mbti,
          item.zodiac ? JSON.stringify(item.zodiac) : null
        );
        migrated.circle++;
      }
    });
    insertMany(circle);
  }

  if (feedback && feedback.feedback) {
    const insert = db.prepare(
      'INSERT INTO feedback_memory (user_id, feedback_type, content, created_at) VALUES (?, ?, ?, ?)'
    );
    const insertMany = db.transaction((items) => {
      for (const item of items) {
        insert.run(req.user.id, item.rating, item.content, item.timestamp);
        migrated.feedback++;
      }
    });
    insertMany(feedback.feedback);
  }

  res.json({ success: true, migrated });
});

// ============ KEPA 自进化 ============

// 获取 KEPA 状态
router.get('/kepa', requireAuth, (req, res) => {
  const kepa = require('../kepa');
  const status = kepa.getStatus(req.user.id);
  res.json({ success: true, ...status });
});

// 手动触发 KEPA 审查
router.post('/kepa/review', requireAuth, (req, res) => {
  const kepa = require('../kepa');
  const result = kepa.runReview(req.user.id);
  res.json({ success: true, ...result });
});

module.exports = router;
