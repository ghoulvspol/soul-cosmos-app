/**
 * Soul Cosmos - 页面访问监控路由
 * POST /api/analytics/track   记录页面访问
 * GET  /api/analytics/stats   获取访问统计
 * GET  /api/analytics/pages   获取各页面访问数据
 */
const express = require('express');
const db = require('../db');

const router = express.Router();

// 记录页面访问（轻量级，不阻塞响应）
router.post('/track', (req, res) => {
  const { page, visitor_id } = req.body;
  if (!page) return res.status(400).json({ success: false, error: 'page required' });

  const ua = req.headers['user-agent'] || '';
  const referer = req.headers.referer || '';
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';

  db.prepare(
    'INSERT INTO page_views (page, visitor_id, user_agent, referer, ip) VALUES (?, ?, ?, ?, ?)'
  ).run(page, visitor_id || '', ua, referer, ip);

  res.json({ success: true });
});

// 获取总览统计
router.get('/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM page_views').get().count;
  const today = db.prepare(
    "SELECT COUNT(*) as count FROM page_views WHERE date(created_at) = date('now')"
  ).get().count;
  const week = db.prepare(
    "SELECT COUNT(*) as count FROM page_views WHERE created_at >= datetime('now', '-7 days')"
  ).get().count;
  const uniqueVisitors = db.prepare(
    'SELECT COUNT(DISTINCT visitor_id) as count FROM page_views WHERE visitor_id != ""'
  ).get().count;
  const uniqueToday = db.prepare(
    "SELECT COUNT(DISTINCT visitor_id) as count FROM page_views WHERE visitor_id != '' AND date(created_at) = date('now')"
  ).get().count;

  // 近 7 天每日趋势
  const trend = db.prepare(`
    SELECT date(created_at) as day, COUNT(*) as views, COUNT(DISTINCT visitor_id) as visitors
    FROM page_views
    WHERE created_at >= datetime('now', '-7 days')
    GROUP BY date(created_at)
    ORDER BY day
  `).all();

  // 近 24 小时按小时分布
  const hourly = db.prepare(`
    SELECT strftime('%H', created_at) as hour, COUNT(*) as count
    FROM page_views
    WHERE created_at >= datetime('now', '-24 hours')
    GROUP BY strftime('%H', created_at)
    ORDER BY hour
  `).all();

  res.json({ success: true, data: { total, today, week, uniqueVisitors, uniqueToday, trend, hourly } });
});

// 获取各页面详细数据
router.get('/pages', (req, res) => {
  // 各页面总访问量
  const pageStats = db.prepare(`
    SELECT page, COUNT(*) as total,
      COUNT(DISTINCT visitor_id) as unique_visitors,
      MAX(created_at) as last_visit
    FROM page_views
    GROUP BY page
    ORDER BY total DESC
  `).all();

  // 各页面今日访问
  const pageToday = db.prepare(`
    SELECT page, COUNT(*) as today
    FROM page_views
    WHERE date(created_at) = date('now')
    GROUP BY page
  `).all();

  // 合并数据
  const todayMap = {};
  pageToday.forEach(r => { todayMap[r.page] = r.today; });

  const pages = pageStats.map(p => ({
    page: p.page,
    total: p.total,
    today: todayMap[p.page] || 0,
    unique_visitors: p.unique_visitors,
    last_visit: p.last_visit,
  }));

  res.json({ success: true, data: pages });
});

// 清除所有访问数据
router.delete('/clear', (req, res) => {
  db.prepare('DELETE FROM page_views').run();
  res.json({ success: true });
});

module.exports = router;
