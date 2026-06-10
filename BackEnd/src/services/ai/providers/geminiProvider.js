const axios = require("axios");
const BaseAIProvider = require("./baseProvider");

class GeminiProvider extends BaseAIProvider {
  constructor(config) {
    super({ name: "gemini", model: config.model || "gemini-1.5-pro" });
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://generativelanguage.googleapis.com/v1beta";
  }

  async generateJson(prompt) {
    const response = await axios.post(
      `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 20000,
      }
    );
    const text =
      response.data?.candidates?.[0]?.content?.parts?.map((part) => part.text).join("") || "{}";
    return JSON.parse(text);
  }
}

module.exports = GeminiProvider;
