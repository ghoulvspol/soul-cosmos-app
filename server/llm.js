/**
 * Soul Cosmos - LLM 调用统一入口
 * 委托给 providers.js 的 callLLM，读取 config-store 的当前配置
 */
const { callLLM } = require('./providers');
const configStore = require('./config-store');

/**
 * 调用 AI 模型
 * @param {Array} messages - [{role, content}]
 * @param {number} maxTokens
 * @returns {Promise<string>}
 */
function callAI(messages, maxTokens = 2000) {
  const active = configStore.getActiveModel();
  return callLLM(messages, maxTokens, {
    provider: active.provider,
    model: active.model,
    temperature: active.temperature,
  });
}

/**
 * 获取当前激活的模型 ID
 */
function getActiveModel() {
  return configStore.getActiveModel().model;
}

module.exports = { callAI, getActiveModel };
