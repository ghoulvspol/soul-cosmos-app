# Soul Cosmos — 产品技术栈说明

> 版本：1.0.0 | 最后更新：2026-05-14

---

## 一、技术架构总览

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (SPA)                     │
│  Vanilla JS · CSS3 Design System · i18n (EN/中文)    │
├─────────────────────────────────────────────────────┤
│                 Express.js API Server                 │
│  JWT Auth · CORS · Static Serving · Port 8066        │
├──────────┬──────────┬──────────┬────────────────────┤
│ AI LLM   │ SQLite   │ Stripe   │ Python (BaZi)      │
│ Provider │ Database │ Payments │ lunar-python        │
└──────────┴──────────┴──────────┴────────────────────┘
```

---

## 二、后端技术栈

### 2.1 运行环境

| 项目 | 选型 | 说明 |
|------|------|------|
| 运行时 | Node.js | 主服务进程 |
| Web 框架 | Express 4.18.0 | REST API |
| 端口 | 8066 | 可通过 `PORT` 环境变量配置 |

### 2.2 核心依赖

| 包名 | 版本 | 用途 |
|------|------|------|
| express | ^4.18.0 | HTTP 服务框架 |
| better-sqlite3 | ^12.10.0 | SQLite 数据库驱动（同步 API，WAL 模式）|
| jsonwebtoken | ^9.0.3 | JWT 签发与验证 |
| bcryptjs | ^3.0.3 | 密码哈希加密 |
| stripe | ^22.1.1 | 订阅支付集成 |

### 2.3 外部依赖

| 依赖 | 说明 |
|------|------|
| Python 3 + lunar-python | 八字排盘计算引擎（通过 `spawnSync` 调用）|
| LLM Provider | OpenAI / DeepSeek / Qwen，OpenAI 兼容协议 |
| Stripe | 订阅制支付（月付/年付）|

### 2.4 API 路由结构

| 路由 | 模块 | 功能 |
|------|------|------|
| `/api/auth/*` | routes/auth.js | 注册、登录、当前用户 |
| `/api/user/*` | routes/user.js | 用户资料、分析历史、反馈、关系圈 |
| `/api/stripe/*` | routes/stripe.js | 订阅 Checkout、Webhook、账单门户 |
| `/api/daily/*` | routes/daily.js | 每日运势生成 |
| `/api/hardware/*` | routes/hardware.js | 设备/环境检测 |
| `/api/analytics/*` | routes/analytics.js | 页面访问监控（track/stats/pages）|

---

## 三、AI 引擎架构

### 3.1 多智能体融合系统 (harness.js)

系统融合 6 个专业分析引擎的输出，通过 LLM 生成统一的灵魂画像：

| Agent | 分析维度 | Token 预算 | 输出 |
|-------|---------|-----------|------|
| BaZi 八字 | 四柱、日主、五行生克 | 150 | 八字格局分析 |
| Astrology 占星 | 太阳/月亮/上升星座 | 150 | 星盘原型解读 |
| Zi Wei 紫微 | 主星、命宫含义 | 150 | 紫微斗数命盘 |
| MBTI | 认知功能表现 | 100 | 性格类型分析 |
| I Ching 易经 | 卦象生命能量 | 100 | 64 卦解读 |
| Psychology 心理学 | 社会心理学洞察 | 100 | 行为模式分析 |

### 3.2 两种执行模式

**快速模式** (~3-4 秒)
- 本地分析引擎（0ms，纯计算）
- 单次融合 API 调用（~4s，1200 tokens）
- 适合日常使用

**标准模式** (~10 秒)
- 6 个 Agent 并行调用（~4s，各 150 tokens）
- 融合层汇总（~6s，1200 tokens）
- 保留完整推理链

### 3.3 Token 预算管理

```
总预算: 6000 tokens
├── 绿区 (>50%): 正常执行
├── 黄区 (20-50%): 减少输出长度
├── 红区 (5-20%): 仅保留核心结论
└── 熔断 (0%): 停止调用，返回降级结果
```

### 3.4 AI Provider 抽象层 (providers.js)

系统支持多 Provider 切换，所有 Provider 使用 OpenAI 兼容的 `/v1/chat/completions` 协议。

| Provider | 模型 | API Key 环境变量 | 状态 |
|----------|------|-----------------|------|
| OpenAI | gpt-4o, gpt-4o-mini, gpt-4.1-mini | `OPENAI_API_KEY` | 默认 |
| DeepSeek | deepseek-chat, deepseek-reasoner | `DEEPSEEK_API_KEY` | 可选 |
| Qwen (通义千问) | qwen-plus, qwen-turbo, qwen-max | `DASHSCOPE_API_KEY` | 可选 |

**架构：**
- `server/providers.js` — Provider 注册表 + `callLLM()` 统一调用
- `server/config-store.js` — SQLite 持久化运行时配置
- `server/mify.js` — 兼容层，委托给 providers.js

**切换方式：**
- Admin 后台 → AI 配置 → 选择模型 → 保存到服务端
- API: `GET /api/models`（列表）/ `POST /api/models/select`（切换）
- 配置持久化到 SQLite `config` 表，重启不丢失

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| 温度 | 0.8 | 平衡创意与准确性 |
| 最大 Tokens | 2000 | 单次请求上限 |
| 超时 | 60 秒 | 单次请求超时 |

---

## 四、KEPA 自进化引擎

KEPA (Knowledge Evolution through Performance Adaptation) 是核心差异化技术：

### 4.1 工作原理

```
用户反馈 → Agent 权重调整 → Prompt 个性化 → 下次输出更准
```

### 4.2 权重体系

- **6 个 Agent** × **6 个维度** = 36 个权重组合
- 维度：overall / career / marriage / health / personality / relationship
- 初始权重：全部 1.0
- 反馈每 10 条触发一次自动 review
- 30 天遗忘机制（删除旧反馈）

### 4.3 数据库表

| 表名 | 用途 |
|------|------|
| agent_weights | 用户级别 Agent 权重 |
| kepa_reviews | 自动审查日志 |
| feedback_memory | 用户反馈存储 |

---

## 五、本地分析引擎 (local-analysis.js)

零延迟的确定性计算，替代 API 调用：

| 系统 | 计算内容 |
|------|---------|
| 八字 | 五行属性 → 性格特质映射 |
| 占星 | 太阳/月亮/上升 → 原型解读 |
| 紫微 | 主星 → 命宫含义 |
| 易经 | 卦象 → 生命能量 |
| MBTI | 类型 → 认知功能 |

### 五行特质映射

| 五行 | 中文 | English |
|------|------|---------|
| 金 | 果断坚毅，重义气，有领导力 | Decisive, loyal, natural leader |
| 木 | 仁慈宽容，有创造力 | Benevolent, creative |
| 水 | 智慧灵活，洞察力强 | Wise, adaptable, perceptive |
| 火 | 热情开朗，有感染力 | Passionate, charismatic |
| 土 | 稳重踏实，包容力强 | Steady, pragmatic |

---

## 六、每日运势系统 (daily.js)

### 6.1 中国历法

| 系统 | 内容 |
|------|------|
| 天干 | 甲乙丙丁戊己庚辛壬癸（10 个）|
| 地支 | 子丑寅卯辰巳午未申酉戌亥（12 个）|
| 五行 | 金木水火土（天干地支对应）|
| 日柱 | 60 天一循环（基准：2000-01-07 甲子日）|

### 6.2 吉凶宜忌

| 宜 | 忌 |
|---|---|
| 社交、签约、面试、投资、学习、运动、旅行 | 争吵、赌博、借贷、冲动消费、熬夜 |

### 6.3 吉时系统

12 时辰对应现代时间：子时 (23:00-01:00) 至 亥时 (21:00-23:00)

---

## 七、前端技术栈

### 7.1 技术选型

| 项目 | 选型 | 说明 |
|------|------|------|
| 框架 | 无（Vanilla JS）| 纯 DOM 操作，零依赖 |
| 样式 | CSS3 + Design Tokens | 30+ CSS 自定义属性 |
| 字体 | Google Fonts | 三字体组合 |
| 动画 | CSS + Canvas | 星空背景 + 过渡动画 |
| 国际化 | 自研 i18n | data-i18n 属性 + JS 切换 |

### 7.2 设计系统 (style.css)

**色彩体系：**

| Token | 色值 | 用途 |
|-------|------|------|
| Canvas | #06060f | 深海军蓝背景 |
| Gold | #d4a574 | 品牌主色 |
| Amethyst | #a78bfa | 辅助色 |
| Nebula | #6366f1 | 渐变色 |
| Cyan | #22d3ee | 强调色 |
| Coral | #f87171 | 警告色 |
| Emerald | #6fcf97 | 成功色 |

**文字层级：**

| 层级 | 色值 |
|------|------|
| Primary | #f0eff4 |
| Secondary | #a8a3b8 |
| Tertiary | #6b6580 |
| Muted | #4a4560 |

**动画曲线：**

| 名称 | 贝塞尔曲线 | 场景 |
|------|-----------|------|
| Expo Out | cubic-bezier(0.16, 1, 0.3, 1) | 通用过渡 |
| Spring | cubic-bezier(0.34, 1.56, 0.64, 1) | 弹性效果 |

**响应式间距：**
```css
section padding: clamp(60px, 10vw, 120px)
max content width: 1140px
```

### 7.3 字体方案

| 字体 | 权重 | 用途 |
|------|------|------|
| Cormorant Garamond | 400, 600, 700 | 标题（衬线）|
| DM Sans | 400, 500, 600, 700 | 正文（无衬线）|
| Noto Serif SC | 400, 600 | 中文回退 |

### 7.4 前端模块

| 文件 | 大小 | 功能 |
|------|------|------|
| js/app.js | 80KB | 主应用逻辑、UI 状态、API 交互 |
| js/astrology.js | 7.4KB | 西方占星计算（太阳/月亮/上升）|
| js/iching.js | 43KB | 易经 64 卦系统 |
| js/auth.js | - | 客户端认证 |
| js/profile.js | - | 资料管理 UI |
| js/share.js | - | 社交分享 |

---

## 八、数据库设计

### 8.1 数据库选型

| 项目 | 选型 |
|------|------|
| 引擎 | SQLite3 (better-sqlite3) |
| 模式 | WAL (Write-Ahead Logging) |
| 并发 | 读写分离，WAL 模式提升并发性能 |
| 外键 | 已启用 |

### 8.2 数据表

| 表名 | 记录内容 | 关键字段 |
|------|---------|---------|
| users | 用户账户 | email, password_hash, nickname |
| profiles | 出生数据与命盘 | birth_date, natal_chart, ziwei_chart, bazi_data |
| analyses | 分析历史 | type, input_data, result_data, model |
| feedback_memory | 反馈记忆 | feedback_type, insight_type, content |
| circle_members | 关系圈 | name, relation, birth_date, zodiac_data |
| subscriptions | 订阅记录 | stripe_customer_id, plan, status |
| agent_weights | KEPA 权重 | agent_name, dimension, weight |
| kepa_reviews | 审查日志 | review_type, findings, actions_taken |
| page_views | 页面访问监控 | page, visitor_id, user_agent, ip |

### 8.3 索引策略

```sql
idx_profiles_user      → profiles(user_id)
idx_analyses_user      → analyses(user_id)
idx_analyses_type      → analyses(user_id, type)
idx_feedback_user      → feedback_memory(user_id)
idx_circle_user        → circle_members(user_id)
idx_kepa_weights       → agent_weights(user_id, agent_name)
idx_kepa_reviews       → kepa_reviews(user_id)
idx_page_views_page    → page_views(page)
idx_page_views_time    → page_views(created_at)
idx_page_views_visitor → page_views(visitor_id)
```

---

## 九、认证与安全

### 9.1 认证方案

| 项目 | 实现 |
|------|------|
| 算法 | JWT HS256（对称签名）|
| 密钥 | `JWT_SECRET` 环境变量（≥32 字符）|
| 过期 | 7 天 |
| 模式 | optionalAuth（Demo 兼容）/ requireAuth（强制认证）|

### 9.2 安全措施

| 措施 | 说明 |
|------|------|
| 密码加密 | bcryptjs，salt rounds = 10 |
| CORS | 白名单机制，通过 `ALLOWED_ORIGINS` 配置 |
| 安全头 | X-Content-Type-Options: nosniff, X-Frame-Options: DENY |
| 输入校验 | BaZi gender 参数白名单防注入 |
| API Key | 环境变量注入，启动时校验，缺失则退出 |

---

## 十、支付系统

| 项目 | 说明 |
|------|------|
| 提供商 | Stripe |
| 模式 | 订阅制（月付 / 年付）|
| 集成方式 | Stripe Checkout + Webhook |
| Webhook | 签名验证，幂等处理防重复 |
| 门户 | Stripe Billing Portal（自助管理）|

---

## 十一、场景建议系统 (scenes.js)

基于元素分类的模板化场景卡片（本地生成，0ms）：

| 元素 | 场景类别 |
|------|---------|
| 火 Fire | 职场火花、情感温暖、内在火焰、财富能量 |
| 土 Earth | 稳固基础、情感稳定、扎根成长、财富积累 |
| 气 Air | 头脑风暴、情感连接、知识探索、财富思维 |
| 水 Water | 直觉导航、情感流动、智慧培养、财富洞察 |

模板变量：`{element}` `{moon}` `{mbti}` `{hexagram}` `{fortune}` `{tendency}`

---

## 十二、环境变量

### 必需

| 变量 | 说明 |
|------|------|
| `JWT_SECRET` | JWT 签名密钥（≥32 字符）|

### AI Provider（至少配一个）

| 变量 | Provider |
|------|----------|
| `OPENAI_API_KEY` | OpenAI |
| `DEEPSEEK_API_KEY` | DeepSeek |
| `DASHSCOPE_API_KEY` | Qwen (通义千问) |

### 可选

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | 8066 | 服务端口 |
| `ALLOWED_ORIGINS` | http://localhost:8066 | CORS 白名单 |
| `STRIPE_SECRET_KEY` | - | Stripe 密钥 |
| `STRIPE_PRICE_MONTHLY` | - | 月付价格 ID |
| `STRIPE_PRICE_YEARLY` | - | 年付价格 ID |
| `STRIPE_WEBHOOK_SECRET` | - | Webhook 签名密钥 |

---

## 十三、页面清单

| 页面 | 文件 | 用途 |
|------|------|------|
| 主页 | index.html | 当前线上版本 |
| V1 | home-v1.html | 设计探索 V1 |
| V2 | home-v2.html | 设计探索 V2 |
| 神秘版 | home-mystic.html | 完整神秘主题（1313 行）|
| 灵境版 | mystic.html | 灵境风格 |
| 哥特版 | gothic.html | 哥特暗黑风 |
| 奢华版 | luxury.html | 奢华简约风 |
| 凤凰玫瑰版 | phoenix-rose.html | 凤凰玫瑰主题 |
| 引导页 | guide.html | 落地引导页 |
| 管理后台 | admin.html | AI 配置、功能开关、Prompt 管理、数据统计、访问监控 |

---

## 十四、部署与运维

### 启动脚本 (start.sh)

- 环境校验（至少一个 AI Provider API Key）
- npm 依赖自动安装
- PID 文件进程管理
- 健康检查轮询
- 日志写入 server.log

### 命令

```bash
./start.sh start    # 启动服务
./start.sh stop     # 停止服务
./start.sh restart  # 重启服务
./start.sh status   # 查看状态
./start.sh logs     # 查看日志
```

---

## 十五、技术亮点

1. **多系统融合** — 八字、占星、紫微、MBTI、易经、心理学 6 大系统统一输出
2. **KEPA 自进化** — 根据用户反馈动态调整 Agent 权重，无需重训模型
3. **双模式引擎** — 快速模式 3-4 秒 / 标准模式 10 秒，按需切换
4. **本地分析** — 确定性计算 0ms 延迟，减少 API 调用
5. **Token 预算** — 绿/黄/红/熔断四级预算控制
6. **4 级 JSON 降级** — 应对 AI 返回格式异常的鲁棒解析
7. **Demo 模式** — 无后端自动降级，12 星座预置数据
8. **页面监控** — 全站 10 页面访问追踪，管理后台实时展示
