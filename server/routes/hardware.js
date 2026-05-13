/**
 * Soul Cosmos - 硬件 API 路由
 * POST /api/hardware/voice      语音交互
 * GET  /api/hardware/alarm      闹铃播报
 * GET  /api/hardware/weekly     周报摘要
 * POST /api/hardware/push       推送配置
 */
const express = require('express');
const { optionalAuth, requireAuth } = require('../auth');
const { handleVoiceQuery, generateAlarmBrief, generateWeeklyReport } = require('../hardware');

const router = express.Router();

// 语音交互
router.post('/voice', optionalAuth, async (req, res) => {
  const { query, lang } = req.body;
  if (!query) return res.status(400).json({ success: false, error: 'query required' });

  const userId = req.user?.id;
  if (!userId) {
    // 未登录用户返回通用回答
    return res.json({
      success: true,
      response: lang === 'zh'
        ? '请先登录以获取个性化语音助手服务。'
        : 'Please log in to use the personalized voice assistant.',
    });
  }

  const result = await handleVoiceQuery(userId, query, lang || 'zh');
  res.json(result);
});

// 闹铃播报
router.get('/alarm', optionalAuth, (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.json({
      success: true,
      text: 'Please log in for your personalized morning briefing.',
      date: new Date().toISOString().slice(0, 10),
    });
  }
  const lang = req.query.lang || 'zh';
  const result = generateAlarmBrief(userId, lang);
  res.json(result);
});

// 周报
router.get('/weekly', requireAuth, async (req, res) => {
  const lang = req.query.lang || 'zh';
  const result = await generateWeeklyReport(req.user.id, lang);
  res.json(result);
});

// 推送配置（注册设备 token）
router.post('/push', requireAuth, (req, res) => {
  const { deviceToken, platform, pushType } = req.body;
  // TODO: 存储设备 token 用于推送
  console.log(`Push registered: user=${req.user.id} device=${deviceToken} platform=${platform} type=${pushType}`);
  res.json({ success: true, message: 'Push notification registered' });
});

module.exports = router;
