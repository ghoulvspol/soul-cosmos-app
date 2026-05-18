/**
 * Soul Cosmos - AI Provider 抽象层
 * 统一 LLM 调用接口，支持多 provider 切换
 * 所有 provider 使用 OpenAI 兼容的 /v1/chat/completions 协议
 */
const http = require('http');
const https = require('https');

// Provider 注册表
const PROVIDERS = {
  openai: {
    name: 'OpenAI',
    host: 'api.openai.com',
    port: 443,
    useHttps: true,
    apiKey: process.env.OPENAI_API_KEY,
    path: '/v1/chat/completions',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', desc: 'OpenAI 旗舰多模态模型', badge: '旗舰' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', desc: '快速低成本，日常任务首选', badge: '经济' },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', desc: '最新一代小型模型', badge: '新品' },
    ],
    defaultModel: 'gpt-4o-mini',
    defaultTemp: 0.8,
    rejectUnauthorized: true,
  },
  deepseek: {
    name: 'DeepSeek',
    host: 'api.deepseek.com',
    port: 443,
    useHttps: true,
    apiKey: process.env.DEEPSEEK_API_KEY,
    path: '/chat/completions',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat', desc: '通用对话模型，性价比极高', badge: '推荐' },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', desc: '深度推理模型，复杂分析', badge: '推理' },
    ],
    defaultModel: 'deepseek-chat',
    defaultTemp: 0.8,
    rejectUnauthorized: true,
  },
  qwen: {
    name: 'Qwen (通义千问)',
    host: 'dashscope.aliyuncs.com',
    port: 443,
    useHttps: true,
    apiKey: process.env.DASHSCOPE_API_KEY,
    path: '/compatible-mode/v1/chat/completions',
    models: [
      { id: 'qwen-plus', name: 'Qwen Plus', desc: '性能与成本均衡', badge: '推荐' },
      { id: 'qwen-turbo', name: 'Qwen Turbo', desc: '快速响应，低成本', badge: '快速' },
      { id: 'qwen-max', name: 'Qwen Max', desc: '最强能力，复杂任务', badge: '旗舰' },
    ],
    defaultModel: 'qwen-plus',
    defaultTemp: 0.8,
    rejectUnauthorized: true,
  },
  // 自定义 OpenAI 兼容端点（支持任意模型：本地 Ollama、vLLM、Together、Groq 等）
  ...(process.env.CUSTOM_API_KEY ? {
    custom: {
      name: process.env.CUSTOM_PROVIDER_NAME || 'Custom',
      host: process.env.CUSTOM_HOST || 'api.openai.com',
      port: parseInt(process.env.CUSTOM_PORT || '443'),
      useHttps: process.env.CUSTOM_USE_HTTPS !== 'false',
      apiKey: process.env.CUSTOM_API_KEY,
      path: process.env.CUSTOM_PATH || '/v1/chat/completions',
      models: [
        { id: process.env.CUSTOM_MODEL || 'gpt-4o-mini', name: process.env.CUSTOM_MODEL || 'Custom Model', desc: '自定义模型', badge: '自定义' },
      ],
      defaultModel: process.env.CUSTOM_MODEL || 'gpt-4o-mini',
      defaultTemp: parseFloat(process.env.CUSTOM_TEMPERATURE || '0.8'),
      rejectUnauthorized: process.env.CUSTOM_REJECT_UNAUTHORIZED !== 'false',
    },
  } : {}),
};

// 默认 provider：有哪个 key 就用哪个
const DEFAULT_PROVIDER = process.env.CUSTOM_API_KEY ? 'custom'
  : process.env.OPENAI_API_KEY ? 'openai'
  : process.env.DEEPSEEK_API_KEY ? 'deepseek'
  : process.env.DASHSCOPE_API_KEY ? 'qwen'
  : 'openai';

/**
 * 获取可用 provider 列表（有 API key 的才算可用）
 */
function getAvailableProviders() {
  const result = [];
  for (const [key, provider] of Object.entries(PROVIDERS)) {
    result.push({
      id: key,
      name: provider.name,
      available: !!provider.apiKey,
      models: provider.models,
      defaultModel: provider.defaultModel,
    });
  }
  return result;
}

/**
 * 获取 provider 配置
 */
function getProvider(providerId) {
  return PROVIDERS[providerId] || null;
}

/**
 * 统一 LLM 调用
 * @param {Array} messages - [{role: 'system'|'user', content: '...'}]
 * @param {number} maxTokens
 * @param {Object} options - { provider, model, temperature }
 * @returns {Promise<string>} AI 响应文本
 */
function callLLM(messages, maxTokens = 2000, options = {}) {
  const providerId = options.provider || DEFAULT_PROVIDER;
  const provider = PROVIDERS[providerId];

  if (!provider) {
    return Promise.reject(new Error(`Unknown provider: ${providerId}`));
  }
  if (!provider.apiKey) {
    return Promise.reject(new Error(`API key not configured for provider: ${provider.name}`));
  }

  const model = options.model || provider.defaultModel;
  const temperature = options.temperature ?? provider.defaultTemp;

  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    });

    const reqOptions = {
      hostname: provider.host,
      port: provider.port,
      path: provider.path,
      method: 'POST',
      rejectUnauthorized: provider.rejectUnauthorized,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const transport = provider.useHttps ? https : http;
    const req = transport.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(`[${provider.name}] ${json.error.message || JSON.stringify(json.error)}`));
          } else {
            const content = json.choices?.[0]?.message?.content || '';
            if (!content) {
              console.warn(`[${provider.name}] empty response:`, JSON.stringify(json).slice(0, 300));
            }
            resolve(content);
          }
        } catch (e) {
          reject(new Error(`[${provider.name}] Parse error: ${data.slice(0, 200)}`));
        }
      });
    });

    req.on('error', (err) => reject(new Error(`[${provider.name}] ${err.message}`)));
    req.setTimeout(60000, () => { req.destroy(); reject(new Error(`[${provider.name}] Timeout`)); });
    req.write(body);
    req.end();
  });
}

module.exports = {
  PROVIDERS,
  DEFAULT_PROVIDER,
  getAvailableProviders,
  getProvider,
  callLLM,
};
