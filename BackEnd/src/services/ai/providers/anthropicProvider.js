const axios = require("axios");
const BaseAIProvider = require("./baseProvider");

class AnthropicProvider extends BaseAIProvider {
  constructor(config) {
    super({ name: "claude", model: config.model || "claude-3-5-sonnet-20241022" });
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://api.anthropic.com/v1";
  }

  async generateJson(prompt) {
    const response = await axios.post(
      `${this.baseUrl}/messages`,
      {
        model: this.model,
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        timeout: 20000,
      }
    );
    const text = response.data?.content?.[0]?.text || "{}";
    return JSON.parse(text);
  }
}

module.exports = AnthropicProvider;
