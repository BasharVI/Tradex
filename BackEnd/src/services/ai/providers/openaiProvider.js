const axios = require("axios");
const BaseAIProvider = require("./baseProvider");

class OpenAIProvider extends BaseAIProvider {
  constructor(config) {
    super({ name: "openai", model: config.model || "gpt-4.1-mini" });
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://api.openai.com/v1";
  }

  async generateJson(prompt) {
    const response = await axios.post(
      `${this.baseUrl}/responses`,
      {
        model: this.model,
        input: prompt,
        text: { format: { type: "json_object" } },
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 20000,
      }
    );
    const text = response.data?.output_text || response.data?.output?.[0]?.content?.[0]?.text || "{}";
    return JSON.parse(text);
  }
}

module.exports = OpenAIProvider;
