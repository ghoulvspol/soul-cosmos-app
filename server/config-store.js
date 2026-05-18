/**
 * Soul Cosmos - 运行时配置存储
 * 将 admin 配置持久化到 SQLite（而非 localStorage）
 */
const db = require('./db');

// 确保 config 表存在（db.js 已创建，这里做防御性检查）
db.exec(`
  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const stmtGet = db.prepare('SELECT value FROM config WHERE key = ?');
const stmtSet = db.prepare('INSERT OR REPLACE INTO config (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)');

/**
 * 获取配置值
 * @param {string} key
 * @param {string} defaultValue
 * @returns {string}
 */
function getConfig(key, defaultValue = null) {
  const row = stmtGet.get(key);
  return row ? row.value : defaultValue;
}

/**
 * 设置配置值
 * @param {string} key
 * @param {string} value
 */
function setConfig(key, value) {
  stmtSet.run(key, String(value));
}

/**
 * 获取当前活跃的 provider 和 model
 * @returns {{ provider: string, model: string, temperature: number, maxTokens: number }}
 */
function getActiveModel() {
  const defaultProvider = process.env.CUSTOM_API_KEY ? 'custom'
    : process.env.OPENAI_API_KEY ? 'openai'
    : process.env.DEEPSEEK_API_KEY ? 'deepseek'
    : process.env.DASHSCOPE_API_KEY ? 'qwen'
    : 'openai';
  const defaultModel = process.env.CUSTOM_MODEL || 'gpt-4o-mini';
  return {
    provider: getConfig('active_provider', defaultProvider),
    model: getConfig('active_model', defaultModel),
    temperature: parseFloat(getConfig('temperature', '0.8')),
    maxTokens: parseInt(getConfig('max_tokens', '2000')),
  };
}

/**
 * 设置活跃的 provider 和 model
 */
function setActiveModel(provider, model, temperature, maxTokens) {
  if (provider) setConfig('active_provider', provider);
  if (model) setConfig('active_model', model);
  if (temperature !== undefined) setConfig('temperature', String(temperature));
  if (maxTokens !== undefined) setConfig('max_tokens', String(maxTokens));
}

module.exports = { getConfig, setConfig, getActiveModel, setActiveModel };
