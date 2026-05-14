/**
 * Soul Cosmos - LLM 调用兼容层
 * 保留 callMify 签名，内部委托给 providers.js
 * 现有调用方零改动
 */
const { callLLM } = require('./providers');
const configStore = require('./config-store');

/**
 * 调用 LLM（兼容旧接口）
 * @param {Array} messages - [{role, content}]
 * @param {number} maxTokens
 * @returns {Promise<string>}
 */
function callMify(messages, maxTokens = 2000) {
  const active = configStore.getActiveModel();
  return callLLM(messages, maxTokens, {
    provider: active.provider,
    model: active.model,
    temperature: active.temperature,
  });
}

/**
 * 获取当前模型名（动态读取）
 */
function getMifyModel() {
  return configStore.getActiveModel().model;
}

module.exports = { callMify, getMifyModel };
