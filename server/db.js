/**
 * Soul Cosmos - SQLite 数据库初始化
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'soul-cosmos.db');

// 确保 data 目录存在
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// 启用 WAL 模式，提升并发性能
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Schema 迁移
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nickname TEXT,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    birth_date TEXT NOT NULL,
    birth_time TEXT,
    birth_city TEXT,
    gender TEXT,
    mbti_type TEXT,
    natal_chart TEXT,
    ziwei_chart TEXT,
    bazi_data TEXT,
    soul_profile TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    input_data TEXT,
    result_data TEXT,
    model TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS feedback_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    analysis_id INTEGER,
    feedback_type TEXT NOT NULL,
    insight_type TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS circle_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    relation TEXT,
    birth_date TEXT,
    birth_time TEXT,
    mbti_type TEXT,
    zodiac_data TEXT,
    profile_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    plan TEXT DEFAULT 'free',
    status TEXT DEFAULT 'active',
    current_period_end DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- KEPA: Agent 权重策略（全局 + 用户级别）
  CREATE TABLE IF NOT EXISTS agent_weights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    agent_name TEXT NOT NULL,
    dimension TEXT NOT NULL,
    weight REAL DEFAULT 1.0,
    accurate_count INTEGER DEFAULT 0,
    inaccurate_count INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, agent_name, dimension)
  );

  -- KEPA: 审查日志
  CREATE TABLE IF NOT EXISTS kepa_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    review_type TEXT NOT NULL,
    findings TEXT,
    actions_taken TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id);
  CREATE INDEX IF NOT EXISTS idx_kepa_weights ON agent_weights(user_id, agent_name);
  CREATE INDEX IF NOT EXISTS idx_kepa_reviews ON kepa_reviews(user_id);
  CREATE INDEX IF NOT EXISTS idx_analyses_user ON analyses(user_id);
  CREATE INDEX IF NOT EXISTS idx_analyses_type ON analyses(user_id, type);
  CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback_memory(user_id);
  CREATE INDEX IF NOT EXISTS idx_circle_user ON circle_members(user_id);
`);

module.exports = db;
