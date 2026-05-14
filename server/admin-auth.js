/**
 * Soul Cosmos - Admin 认证中间件
 * 保护管理端点：analytics、model switching、admin dashboard
 *
 * 如果 ADMIN_API_KEY 环境变量已设置，请求必须携带 X-Admin-Key header
 * 如果未设置，允许所有请求（本地开发模式）
 */

const ADMIN_KEY = process.env.ADMIN_API_KEY;

/**
 * Admin 认证中间件
 * 检查 X-Admin-Key header 是否匹配 ADMIN_API_KEY
 */
function requireAdmin(req, res, next) {
  if (!ADMIN_KEY) {
    // 未配置 admin key，放行（本地开发模式）
    return next();
  }
  const provided = req.headers['x-admin-key'] || req.query.admin_key;
  if (provided === ADMIN_KEY) {
    return next();
  }
  return res.status(401).json({ success: false, error: 'Admin key required' });
}

/**
 * 简易速率限制器（内存计数，按 IP）
 * @param {number} maxRequests - 时间窗口内最大请求数
 * @param {number} windowMs - 时间窗口（毫秒）
 */
function rateLimit(maxRequests = 60, windowMs = 60000) {
  const hits = new Map();

  // 每分钟清理过期记录
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of hits) {
      if (now - data.start > windowMs) hits.delete(ip);
    }
  }, windowMs).unref();

  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const record = hits.get(ip);

    if (!record || now - record.start > windowMs) {
      hits.set(ip, { start: now, count: 1 });
      return next();
    }

    record.count++;
    if (record.count > maxRequests) {
      return res.status(429).json({ success: false, error: 'Too many requests' });
    }
    next();
  };
}

module.exports = { requireAdmin, rateLimit };
