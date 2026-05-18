<p align="center">
  <img src="https://img.shields.io/badge/Soul%20Cosmos-v1.0-purple?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" />
</p>

# Soul Cosmos

AI 驱动的多维人格分析平台。融合西方占星、东方八字、紫微斗数、MBTI、易经、心理学六大系统，生成你的灵魂画像。

<p align="center">
  <em>Discover Your Multi-Dimensional Self</em>
</p>

---

## 核心功能

**六大分析引擎融合**
- 西方占星（太阳/月亮/上升星座）
- 四柱八字（五行、日主、格局）
- 紫微斗数（命宫、主星）
- MBTI 性格类型
- 易经 64 卦
- 社会心理学洞察

**AI 灵魂画像** — 多引擎输出经 LLM 融合，生成个性化灵魂描述、核心特质、阴影面、人生主题

**KEPA 自进化引擎** — 根据用户反馈（准/不准）动态调整各引擎权重，越用越准

**每日运势** — 结合天干地支、黄历的个性化日运，含吉凶宜忌和吉时

**关系圈分析** — 添加亲友的出生数据，做合盘兼容性分析

**场景建议** — 基于五行属性的职场、感情、成长、财富场景卡片

**多 Provider 支持** — 后台一键切换 AI 模型，支持 OpenAI / DeepSeek / Qwen

---

## 技术架构

```
┌─────────────────────────────────────────────────┐
│              Frontend (Vanilla JS)               │
│   CSS3 Design System · Canvas Starfield · i18n  │
├─────────────────────────────────────────────────┤
│             Express.js API Server                │
│   JWT Auth · CORS · Static Serving · Port 8066  │
├──────────┬──────────┬──────────┬────────────────┤
│ AI LLM   │ SQLite   │          │ Python (BaZi)  │
│ Provider │ Database │ Payments │ lunar-python    │
└──────────┴──────────┴──────────┴────────────────┘
```

| 层 | 技术 | 说明 |
|---|---|---|
| 前端 | Vanilla JS + CSS3 | 零框架依赖，设计系统驱动 |
| 后端 | Node.js + Express | REST API，JWT 认证 |
| 数据库 | SQLite (better-sqlite3) | WAL 模式，9 张表 |
| AI | OpenAI 兼容协议 | 多 Provider 可切换 |
| 支付 | 无 | 完全免费 |
| 八字引擎 | Python + lunar-python | 四柱排盘计算 |

---

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/YOUR_USERNAME/soul-cosmos.git
cd soul-cosmos
```

### 2. 安装依赖

```bash
cd server && npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，至少配置一个 AI Provider 的 API Key：

```bash
# OpenAI
OPENAI_API_KEY=sk-your-key-here

# DeepSeek
DEEPSEEK_API_KEY=sk-your-key-here

# Qwen (通义千问)
DASHSCOPE_API_KEY=sk-your-key-here

# JWT 密钥
JWT_SECRET=your-random-secret-at-least-32-chars
```

### 4. 启动服务

```bash
# 方式一：脚本启动
./start.sh start

# 方式二：直接启动
cd server && node index.js
```

访问 `http://localhost:8066`

### 5. 管理后台

访问 `http://localhost:8066/admin.html` 可以：
- 切换 AI 模型（OpenAI / DeepSeek / Qwen）
- 调整温度、Token 参数
- 管理功能开关
- 编辑 Prompt 模板
- 查看数据统计和访问监控

---

## AI Provider 配置

系统支持多个 LLM Provider，通过管理后台一键切换：

| Provider | 模型 | 环境变量 |
|----------|------|---------|
| OpenAI | GPT-4o, GPT-4o Mini, GPT-4.1 Mini | `OPENAI_API_KEY` |
| DeepSeek | DeepSeek Chat, DeepSeek Reasoner | `DEEPSEEK_API_KEY` |
| Qwen | Qwen Plus, Qwen Turbo, Qwen Max | `DASHSCOPE_API_KEY` |
| 自定义 | 任意 OpenAI 兼容模型 | `CUSTOM_API_KEY` + `CUSTOM_HOST` |

所有 Provider 使用 OpenAI 兼容的 `/v1/chat/completions` 协议。切换后配置自动持久化到 SQLite。

### 自定义 Provider（支持任意模型）

支持 Ollama、vLLM、Together、Groq、硅基流动等任意 OpenAI 兼容端点：

```bash
CUSTOM_API_KEY=sk-your-key
CUSTOM_PROVIDER_NAME=My Provider
CUSTOM_HOST=api.example.com
CUSTOM_PORT=443
CUSTOM_MODEL=gpt-4o-mini
```

---

## 项目结构

```
soul-cosmos/
├── server/
│   ├── index.js              # API 服务主入口
│   ├── providers.js          # AI Provider 抽象层（OpenAI/DeepSeek/Qwen/自定义）
│   ├── config-store.js       # 运行时配置存储
│   ├── llm.js                # LLM 调用统一入口
│   ├── mify.js               # LLM 调用兼容层（旧版，保留向后兼容）
│   ├── auth.js               # JWT 认证中间件
│   ├── db.js                 # SQLite 数据库初始化
│   ├── kepa.js               # KEPA 自进化引擎
│   ├── harness.js            # 多智能体编排系统（模板优先）
│   ├── template-engine.js    # 模板匹配引擎（精确/降级/LLM兜底）
│   ├── template-db.js        # 模板数据库（JSON 加载 + 内存索引）
│   ├── bazi.py               # Python 八字排盘（支持全球时区）
│   ├── daily-engine.js       # 日运计算引擎
│   ├── weekly-engine.js      # 周运计算引擎
│   ├── monthly-engine.js     # 月运计算引擎
│   ├── daily.js              # 每日运势生成
│   ├── scenes.js             # 场景建议模板
│   ├── local-analysis.js     # 本地分析引擎（5系统）
│   ├── templates/            # 种子模板目录
│   │   ├── seed-profiles.json    # 5000+ 画像模板
│   │   └── seed-daily.json       # 日运模板
│   └── routes/
│       ├── auth.js           # 注册、登录
│       ├── user.js           # 用户数据
│       ├── reading.js        # 周期测算 API（画像/日运/周运/月运）
│       ├── daily.js          # 每日运势 API
│       ├── analytics.js      # 页面访问监控
│       └── hardware.js       # 设备检测
├── js/
│   ├── app.js                # 主应用逻辑 (80KB)
│   ├── astrology.js          # 占星计算引擎
│   ├── iching.js             # 易经 64 卦系统
│   ├── auth.js               # 客户端认证
│   ├── profile.js            # 资料管理 UI
│   └── share.js              # 社交分享
├── css/
│   └── style.css             # 设计系统 (38KB)
├── index.html                # 主页
├── admin.html                # 管理后台
├── *.html                    # 设计变体页面
├── docs/
│   └── TECH_STACK.md         # 技术栈详细说明
├── .env.example              # 环境变量模板
├── .gitignore
├── start.sh                  # 启动脚本
└── package.json
```

---

## 数据库表

| 表 | 用途 |
|---|---|
| users | 用户账户 |
| profiles | 出生数据与命盘 |
| analyses | 分析历史 |
| feedback_memory | 反馈记忆（KEPA） |
| circle_members | 关系圈 |
| subscriptions | 预留（未使用） |
| agent_weights | KEPA 引擎权重 |
| kepa_reviews | 自动审查日志 |
| page_views | 页面访问监控 |
| config | 运行时配置 |

---

## 设计系统

| Token | 色值 | 用途 |
|-------|------|------|
| Canvas | `#06060f` | 深海军蓝背景 |
| Gold | `#d4a574` | 品牌主色 |
| Amethyst | `#a78bfa` | 辅助色 |
| Nebula | `#6366f1` | 渐变色 |

字体：Cormorant Garamond（标题）+ DM Sans（正文）+ Noto Serif SC（中文）

---

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/auth/register` | POST | 注册 |
| `/api/auth/login` | POST | 登录 |
| `/api/auth/me` | GET | 当前用户 |
| `/api/generate-profile` | POST | 生成灵魂画像 |
| `/api/harness-profile` | POST | 多引擎画像 |
| `/api/reading/profile` | POST | 画像（模板匹配，$0） |
| `/api/reading/daily` | POST | 今日运势（本地计算，$0） |
| `/api/reading/weekly` | POST | 本周运势（本地计算，$0） |
| `/api/reading/monthly` | POST | 本月运势（本地计算，$0） |
| `/api/daily-insight` | POST | 每日洞察 |
| `/api/compatibility` | POST | 关系分析 |
| `/api/weekly-forecast` | POST | 周度预测 |
| `/api/fengshui` | POST | 风水分析 |
| `/api/photo-analysis` | POST | 面相手相 |
| `/api/scenes` | POST | 场景建议 |
| `/api/models` | GET | 可用模型列表 |
| `/api/models/select` | POST | 切换模型 |
| `/api/analytics/track` | POST | 页面访问记录 |
| `/api/analytics/stats` | GET | 访问统计 |
| `/api/health` | GET | 健康检查 |

---

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `JWT_SECRET` | 是 | JWT 签名密钥（≥32 字符）|
| `OPENAI_API_KEY` | 至少一个 | OpenAI API Key |
| `DEEPSEEK_API_KEY` | 至少一个 | DeepSeek API Key |
| `DASHSCOPE_API_KEY` | 至少一个 | Qwen API Key |
| `PORT` | 否 | 服务端口（默认 8066）|
| `ALLOWED_ORIGINS` | 否 | CORS 白名单 |
| `STRIPE_SECRET_KEY` | 否 | 预留（未使用） |

---

## License

MIT
