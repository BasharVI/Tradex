const OpenAIProvider = require("./providers/openaiProvider");
const AnthropicProvider = require("./providers/anthropicProvider");
const GeminiProvider = require("./providers/geminiProvider");
const MockAIProvider = require("./providers/mockProvider");
const { env } = require("../../config/env");

function createProvider(config = {}) {
  const provider = String(config.provider || process.env.AI_PROVIDER || "mock").toLowerCase();
  if (provider === "openai" && config.apiKey) return new OpenAIProvider(config);
  if (provider === "claude" && config.apiKey) return new AnthropicProvider(config);
  if (provider === "gemini" && config.apiKey) return new GeminiProvider(config);
  if (env === "test") return new MockAIProvider();
  if (!config.apiKey) return new MockAIProvider();
  if (provider === "openai") return new OpenAIProvider(config);
  if (provider === "claude") return new AnthropicProvider(config);
  if (provider === "gemini") return new GeminiProvider(config);
  return new MockAIProvider();
}

module.exports = { createProvider };
