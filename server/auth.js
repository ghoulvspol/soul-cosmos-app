/**
 * Soul Cosmos - JWT 认证中间件
 * 支持可选认证：无 token 时 req.user = null（兼容 Demo 模式）
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'soul-cosmos-dev-secret-change-in-prod';
const JWT_EXPIRES = '30d';

/**
 * 签发 JWT
 */
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

/**
 * 验证 JWT
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * 可选认证中间件
 * 有 token → 解析用户信息到 req.user
 * 无 token → req.user = null，不报错
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      req.user = verifyToken(token);
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

/**
 * 必须认证中间件
 * 无 token 或 token 无效 → 401
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Login required' });
  }
  try {
    const token = authHeader.slice(7);
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

module.exports = { signToken, verifyToken, optionalAuth, requireAuth };
