/**
 * Soul Cosmos - Mify 网关调用模块
 */
const http = require('http');

const MIFY_HOST = 'model.mify.ai.srv';
const MIFY_PORT = 80;
const MIFY_PATH = '/v1/chat/completions';
const MIFY_MODEL = 'xiaomi/mimo-v2.5-pro';
const MIFY_API_KEY = process.env.MIFY_API_KEY;

/**
 * 调用 Mify 网关
 */
function callMify(messages, maxTokens = 2000) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MIFY_MODEL,
      messages,
      temperature: 0.8,
      max_tokens: maxTokens,
    });

    const options = {
      hostname: MIFY_HOST,
      port: MIFY_PORT,
      path: MIFY_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MIFY_API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(json.error.message || JSON.stringify(json.error)));
          } else {
            const content = json.choices?.[0]?.message?.content || '';
            if (!content) {
              console.warn('Mify empty response:', JSON.stringify(json).slice(0, 300));
            }
            resolve(content);
          }
        } catch (e) {
          reject(new Error(`Parse error: ${data.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
}

module.exports = { callMify, MIFY_MODEL };
