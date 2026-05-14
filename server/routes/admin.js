/**
 * Soul Cosmos - Admin 管理路由
 * 所有端点需要 admin key 认证
 *
 * GET  /api/admin/dashboard   总览数据
 * GET  /api/admin/users       用户列表（分页+搜索）
 * GET  /api/admin/users/:id   用户详情
 * DELETE /api/admin/users/:id 删除用户
 * GET  /api/admin/system      系统健康
 * GET  /api/admin/insights    分析洞察
 */
const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../admin-auth');
const os = require('os');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// 所有 admin 路由需要认证
router.use(requireAdmin);

// ============ 总览 Dashboard ============

router.get('/dashboard', (req, res) => {
  try {
    // 用户统计
    const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    const todayUsers = db.prepare("SELECT COUNT(*) as c FROM users WHERE date(created_at) = date('now')").get().c;
    const activeUsers = db.prepare("SELECT COUNT(*) as c FROM users WHERE last_login_at >= datetime('now', '-7 days')").get().c;

    // 分析统计
    const totalAnalyses = db.prepare('SELECT COUNT(*) as c FROM analyses').get().c;
    const todayAnalyses = db.prepare("SELECT COUNT(*) as c FROM analyses WHERE date(created_at) = date('now')").get().c;

    // 反馈统计
    const totalFeedback = db.prepare('SELECT COUNT(*) as c FROM feedback_memory').get().c;
    const accurateFeedback = db.prepare("SELECT COUNT(*) as c FROM feedback_memory WHERE feedback_type = 'accurate'").get().c;
    const accuracyRate = totalFeedback > 0 ? Math.round(accurateFeedback / totalFeedback * 100) : null;

    // 近 7 天用户注册趋势
    const userTrend = db.prepare(`
      SELECT date(created_at) as day, COUNT(*) as count
      FROM users WHERE created_at >= datetime('now', '-7 days')
      GROUP BY date(created_at) ORDER BY day
    `).all();

    // 近 7 天分析趋势
    const analysisTrend = db.prepare(`
      SELECT date(created_at) as day, COUNT(*) as count
      FROM analyses WHERE created_at >= datetime('now', '-7 days')
      GROUP BY date(created_at) ORDER BY day
    `).all();

    // 最近活动（用户注册 + 分析完成）
    const recentUsers = db.prepare(`
      SELECT 'register' as type, email as detail, created_at FROM users ORDER BY created_at DESC LIMIT 5
    `).all();
    const recentAnalyses = db.prepare(`
      SELECT 'analysis' as type, type as detail, created_at FROM analyses ORDER BY created_at DESC LIMIT 5
    `).all();
    const recentActivity = [...recentUsers, ...recentAnalyses]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 8);

    // 分析类型分布
    const analysisTypes = db.prepare(`
      SELECT type, COUNT(*) as count FROM analyses GROUP BY type ORDER BY count DESC
    `).all();

    // 系统摘要
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, today: todayUsers, active7d: activeUsers },
        analyses: { total: totalAnalyses, today: todayAnalyses },
        feedback: { total: totalFeedback, accuracy: accuracyRate },
        userTrend,
        analysisTrend,
        analysisTypes,
        recentActivity,
        system: {
          uptime: Math.floor(uptime),
          memoryMB: Math.round(memUsage.heapUsed / 1024 / 1024),
          memoryTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ 用户管理 ============

router.get('/users', (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let whereClause = '';
    let params = [];
    if (search) {
      whereClause = 'WHERE u.email LIKE ? OR u.nickname LIKE ?';
      params = [`%${search}%`, `%${search}%`];
    }

    const total = db.prepare(`SELECT COUNT(*) as c FROM users u ${whereClause}`).get(...params).c;

    const users = db.prepare(`
      SELECT u.id, u.email, u.nickname, u.avatar_url, u.created_at, u.last_login_at,
        (SELECT COUNT(*) FROM profiles WHERE user_id = u.id) as profile_count,
        (SELECT COUNT(*) FROM analyses WHERE user_id = u.id) as analysis_count,
        (SELECT COUNT(*) FROM feedback_memory WHERE user_id = u.id) as feedback_count
      FROM users u ${whereClause}
      ORDER BY u.created_at DESC LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    res.json({
      success: true,
      data: { users, total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/users/:id', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = db.prepare('SELECT id, email, nickname, avatar_url, created_at, last_login_at FROM users WHERE id = ?').get(userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const profiles = db.prepare(
      'SELECT id, birth_date, birth_time, birth_city, gender, mbti_type, created_at FROM profiles WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId);

    const analyses = db.prepare(
      'SELECT id, type, model, created_at FROM analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT 20'
    ).all(userId);

    const feedback = db.prepare(
      'SELECT id, feedback_type, insight_type, content, created_at FROM feedback_memory WHERE user_id = ? ORDER BY created_at DESC LIMIT 20'
    ).all(userId);

    const circle = db.prepare(
      'SELECT id, name, relation, birth_date, created_at FROM circle_members WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId);

    const subscription = db.prepare(
      'SELECT plan, status, current_period_end FROM subscriptions WHERE user_id = ?'
    ).get(userId);

    res.json({
      success: true,
      data: { ...user, profiles, analyses, feedback, circle, subscription },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/users/:id', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    // CASCADE deletes handle related tables
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    console.log(`Admin deleted user: ${user.email} (id: ${userId})`);
    res.json({ success: true, message: `User ${user.email} deleted` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ 系统健康 ============

router.get('/system', (req, res) => {
  try {
    // 进程信息
    const uptime = process.uptime();
    const mem = process.memoryUsage();

    // 数据库统计
    const dbPath = path.join(__dirname, '..', 'data', 'soul-cosmos.db');
    let dbSize = 0;
    try { dbSize = fs.statSync(dbPath).size; } catch {}

    const tables = ['users', 'profiles', 'analyses', 'feedback_memory', 'circle_members',
      'subscriptions', 'agent_weights', 'kepa_reviews', 'page_views', 'config'];
    const tableCounts = {};
    for (const t of tables) {
      try {
        tableCounts[t] = db.prepare(`SELECT COUNT(*) as c FROM ${t}`).get().c;
      } catch {
        tableCounts[t] = 0;
      }
    }

    // KEPA 状态
    const totalFeedback = db.prepare('SELECT COUNT(*) as c FROM feedback_memory').get().c;
    const accurateCount = db.prepare("SELECT COUNT(*) as c FROM feedback_memory WHERE feedback_type = 'accurate'").get().c;
    const inaccurateCount = db.prepare("SELECT COUNT(*) as c FROM feedback_memory WHERE feedback_type = 'inaccurate'").get().c;
    const lastReview = db.prepare('SELECT created_at, review_type, findings FROM kepa_reviews ORDER BY created_at DESC LIMIT 1').get();

    // Agent 权重统计
    const agentStats = db.prepare(`
      SELECT agent_name, AVG(weight) as avg_weight, SUM(accurate_count) as total_accurate, SUM(inaccurate_count) as total_inaccurate
      FROM agent_weights GROUP BY agent_name
    `).all();

    // 最近错误（从 analyses 中找失败的）
    const recentErrors = db.prepare(`
      SELECT type, created_at, input_data FROM analyses
      WHERE result_data IS NULL OR result_data = ''
      ORDER BY created_at DESC LIMIT 5
    `).all();

    res.json({
      success: true,
      data: {
        process: {
          uptime: Math.floor(uptime),
          nodeVersion: process.version,
          platform: process.platform,
          memoryHeapUsed: Math.round(mem.heapUsed / 1024 / 1024),
          memoryHeapTotal: Math.round(mem.heapTotal / 1024 / 1024),
          memoryRss: Math.round(mem.rss / 1024 / 1024),
        },
        database: {
          path: dbPath,
          sizeBytes: dbSize,
          sizeMB: (dbSize / 1024 / 1024).toFixed(2),
          tables: tableCounts,
        },
        kepa: {
          totalFeedback,
          accurate: accurateCount,
          inaccurate: inaccurateCount,
          accuracy: totalFeedback > 0 ? Math.round(accurateCount / totalFeedback * 100) : null,
          agentStats,
          lastReview: lastReview || null,
        },
        recentErrors,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ 分析洞察 ============

router.get('/insights', (req, res) => {
  try {
    // 分析类型分布
    const typeDistribution = db.prepare(`
      SELECT type, COUNT(*) as count FROM analyses GROUP BY type ORDER BY count DESC
    `).all();

    // 模型使用统计
    const modelUsage = db.prepare(`
      SELECT model, COUNT(*) as count FROM analyses WHERE model IS NOT NULL GROUP BY model ORDER BY count DESC
    `).all();

    // 近 7 天准确率趋势
    const accuracyTrend = db.prepare(`
      SELECT date(created_at) as day,
        SUM(CASE WHEN feedback_type = 'accurate' THEN 1 ELSE 0 END) as accurate,
        SUM(CASE WHEN feedback_type = 'inaccurate' THEN 1 ELSE 0 END) as inaccurate,
        COUNT(*) as total
      FROM feedback_memory
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY date(created_at) ORDER BY day
    `).all();

    // 最活跃用户 Top 5
    const topUsers = db.prepare(`
      SELECT u.id, u.email, u.nickname, COUNT(a.id) as analysis_count
      FROM users u LEFT JOIN analyses a ON u.id = a.user_id
      GROUP BY u.id ORDER BY analysis_count DESC LIMIT 5
    `).all();

    // 反馈类型分布
    const feedbackTypes = db.prepare(`
      SELECT feedback_type, COUNT(*) as count FROM feedback_memory GROUP BY feedback_type
    `).all();

    // 分析维度分布（KEPA insight_type）
    const insightTypes = db.prepare(`
      SELECT insight_type, COUNT(*) as count FROM feedback_memory
      WHERE insight_type IS NOT NULL GROUP BY insight_type ORDER BY count DESC
    `).all();

    res.json({
      success: true,
      data: {
        typeDistribution,
        modelUsage,
        accuracyTrend,
        topUsers,
        feedbackTypes,
        insightTypes,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
