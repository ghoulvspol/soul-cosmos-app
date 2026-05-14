/**
 * Soul Cosmos - 页面访问监控路由
 * POST /api/analytics/track   记录页面访问（限流 60/min）
 * GET  /api/analytics/stats   获取访问统计（需 admin key）
 * GET  /api/analytics/pages   获取各页面访问数据（需 admin key）
 * DELETE /api/analytics/clear  清除访问数据（需 admin key）
 */
const express = require('express');
const db = require('../db');
const { requireAdmin, rateLimit } = require('../admin-auth');

const router = express.Router();

// 允许的页面白名单
const KNOWN_PAGES = [
  'index.html', 'home-v1.html', 'home-v2.html', 'home-mystic.html',
  'mystic.html', 'gothic.html', 'luxury.html', 'phoenix-rose.html',
  'guide.html', 'admin.html',
];

// 记录页面访问（限流 60 次/分钟/IP）
router.post('/track', rateLimit(60, 60000), (req, res) => {
  const { page, visitor_id } = req.body;
  if (!page) return res.status(400).json({ success: false, error: 'page required' });

  // 验证 page 参数（防注入 + 防垃圾数据）
  const safePage = String(page).slice(0, 100);
  if (!KNOWN_PAGES.includes(safePage)) {
    return res.status(400).json({ success: false, error: 'Unknown page' });
  }

  const ua = String(req.headers['user-agent'] || '').slice(0, 500);
  const referer = String(req.headers.referer || '').slice(0, 500);
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const safeVisitorId = String(visitor_id || '').slice(0, 64);

  db.prepare(
    'INSERT INTO page_views (page, visitor_id, user_agent, referer, ip) VALUES (?, ?, ?, ?, ?)'
  ).run(safePage, safeVisitorId, ua, referer, ip);

  res.json({ success: true });
});

// 获取总览统计（需 admin）
router.get('/stats', requireAdmin, (req, res) => {
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

  const trend = db.prepare(`
    SELECT date(created_at) as day, COUNT(*) as views, COUNT(DISTINCT visitor_id) as visitors
    FROM page_views WHERE created_at >= datetime('now', '-7 days')
    GROUP BY date(created_at) ORDER BY day
  `).all();

  const hourly = db.prepare(`
    SELECT strftime('%H', created_at) as hour, COUNT(*) as count
    FROM page_views WHERE created_at >= datetime('now', '-24 hours')
    GROUP BY strftime('%H', created_at) ORDER BY hour
  `).all();

  res.json({ success: true, data: { total, today, week, uniqueVisitors, uniqueToday, trend, hourly } });
});

// 获取各页面详细数据（需 admin）
router.get('/pages', requireAdmin, (req, res) => {
  const pageStats = db.prepare(`
    SELECT page, COUNT(*) as total,
      COUNT(DISTINCT visitor_id) as unique_visitors,
      MAX(created_at) as last_visit
    FROM page_views GROUP BY page ORDER BY total DESC
  `).all();

  const pageToday = db.prepare(`
    SELECT page, COUNT(*) as today
    FROM page_views WHERE date(created_at) = date('now') GROUP BY page
  `).all();

  const todayMap = {};
  pageToday.forEach(r => { todayMap[r.page] = r.today; });

  const pages = pageStats.map(p => ({
    page: p.page, total: p.total, today: todayMap[p.page] || 0,
    unique_visitors: p.unique_visitors, last_visit: p.last_visit,
  }));

  res.json({ success: true, data: pages });
});

// 清除所有访问数据（需 admin）
router.delete('/clear', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM page_views').run();
  res.json({ success: true });
});

module.exports = router;
