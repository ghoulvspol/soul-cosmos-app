/**
 * Soul Cosmos - 每日运势路由
 * GET  /api/daily/today     获取今日黄历+运势
 * GET  /api/daily/:date     获取指定日期运势
 */
const express = require('express');
const { optionalAuth } = require('../auth');
const { generateAlmanac, generateDailyFortune } = require('../daily');

const router = express.Router();

// 获取今日运势
router.get('/today', optionalAuth, (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const lang = req.query.lang || 'zh';

  if (req.user) {
    const fortune = generateDailyFortune(req.user.id, today, lang);
    res.json({ success: true, ...fortune });
  } else {
    const almanac = generateAlmanac(today, lang);
    res.json({ success: true, almanac, personalNote: '' });
  }
});

// 获取指定日期运势
router.get('/:date', optionalAuth, (req, res) => {
  const { date } = req.params;
  const lang = req.query.lang || 'zh';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ success: false, error: 'Invalid date format (YYYY-MM-DD)' });
  }

  if (req.user) {
    const fortune = generateDailyFortune(req.user.id, date, lang);
    res.json({ success: true, ...fortune });
  } else {
    const almanac = generateAlmanac(date, lang);
    res.json({ success: true, almanac, personalNote: '' });
  }
});

module.exports = router;
