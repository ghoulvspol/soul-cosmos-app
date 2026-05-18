/**
 * @deprecated Use ./llm.js instead
 * 保留向后兼容，内部委托给 llm.js
 */
const { callAI, getActiveModel } = require('./llm');

function callMify(messages, maxTokens = 2000) {
  return callAI(messages, maxTokens);
}

function getMifyModel() {
  return getActiveModel();
}

module.exports = { callMify, getMifyModel };
