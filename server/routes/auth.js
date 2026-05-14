/**
 * Soul Cosmos - 认证路由
 * POST /api/auth/register  注册
 * POST /api/auth/login     登录
 * GET  /api/auth/me        获取当前用户
 * POST /api/auth/logout    登出（客户端清 token）
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken, requireAuth } = require('../auth');

const router = express.Router();

// 注册
router.post('/register', async (req, res) => {
  const { email, password, nickname } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ success: false, error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = db.prepare(
    'INSERT INTO users (email, password_hash, nickname) VALUES (?, ?, ?)'
  ).run(email, passwordHash, nickname || email.split('@')[0]);

  const token = signToken({ id: result.lastInsertRowid, email });
  res.json({
    success: true,
    token,
    user: { id: result.lastInsertRowid, email, nickname: nickname || email.split('@')[0] }
  });
});

// 登录
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  // 更新最后登录时间
  db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

  const token = signToken({ id: user.id, email: user.email });
  res.json({
    success: true,
    token,
    user: { id: user.id, email: user.email, nickname: user.nickname, avatar_url: user.avatar_url }
  });
});

// 获取当前用户信息
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email, nickname, avatar_url, created_at, last_login_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  res.json({ success: true, user });
});

module.exports = router;
