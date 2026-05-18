// server/routes/reading.js
const express = require('express');
const router = express.Router();
const path = require('path');
const { spawnSync } = require('child_process');
const { optionalAuth } = require('../auth');
const templateEngine = require('../template-engine');
const dailyEngine = require('../daily-engine');
const weeklyEngine = require('../weekly-engine');
const monthlyEngine = require('../monthly-engine');

function calculateBaziFromRequest(birthDate, birthTime, longitude, gender) {
  const [year, month, day] = birthDate.split('-').map(Number);
  const [hour, minute] = (birthTime || '12:00').split(':').map(Number);
  const safeGender = ['male', 'female', 'unknown'].includes(gender) ? gender : 'unknown';
  const result = spawnSync('python3', [
    path.join(__dirname, '..', 'bazi.py'),
    String(year), String(month), String(day), String(hour || 12),
    String(minute || 0), String(longitude || 120), safeGender,
  ], { encoding: 'utf-8', timeout: 15000 });
  if (result.error) throw result.error;
  return JSON.parse(result.stdout);
}

// 一次性画像（模板匹配）
router.post('/profile', optionalAuth, async (req, res) => {
  try {
    const { birth_date, birth_time, birth_city, longitude, latitude, gender, mbti_type, lang } = req.body;

    if (!birth_date) {
      return res.status(400).json({ success: false, error: 'birth_date required' });
    }

    const bazi = calculateBaziFromRequest(birth_date, birth_time, longitude, gender);

    const tags = {
      bazi,
      natalChart: req.body.natal_chart || req.body.natalChart || null,
      ziweiChart: req.body.ziwei_chart || req.body.ziweiChart || null,
      mbtiType: mbti_type || req.body.mbtiType || null,
      iching: req.body.iching || null,
      gender: gender || 'unknown',
      birthDate: birth_date,
      lang: lang || 'en',
    };

    const result = await templateEngine.matchAndRender(tags, lang || 'en');

    res.json({
      success: true,
      mode: result.mode,
      profile: result.profile,
      matchType: result.matchType,
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 日运
router.post('/daily', optionalAuth, (req, res) => {
  try {
    const { birth_date, birth_time, longitude, mbti_type, gender, lang } = req.body;
    const result = dailyEngine.generateDailyForecast(
      { birthDate: birth_date, mbtiType: mbti_type, gender },
      new Date()
    );
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 周运
router.post('/weekly', optionalAuth, (req, res) => {
  try {
    const { birth_date, mbti_type, gender, lang } = req.body;
    const result = weeklyEngine.generateWeeklyForecast(
      { birthDate: birth_date, mbtiType: mbti_type, gender },
      new Date()
    );
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 月运
router.post('/monthly', optionalAuth, (req, res) => {
  try {
    const { birth_date, mbti_type, gender, lang } = req.body;
    const result = monthlyEngine.generateMonthlyForecast(
      { birthDate: birth_date, mbtiType: mbti_type, gender },
      new Date()
    );
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
