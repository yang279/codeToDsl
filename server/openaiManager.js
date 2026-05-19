const OpenAI = require('openai');

let instance = null;

function getClient() {
  if (!instance) {
    const apiKey = process.env.OPENAI_API_KEY;
    const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY 未配置');
    }

    instance = new OpenAI({ apiKey, baseURL });
  }
  return instance;
}

function resetClient() {
  instance = null;
}

module.exports = { getClient, resetClient };
