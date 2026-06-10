const AppError = require("../../../utils/AppError");
const GoogleProvider = require("./GoogleProvider");
const FacebookProvider = require("./FacebookProvider");

// Registry of supported providers. To add Apple/LinkedIn later:
//   1) implement a new subclass of Provider
//   2) register it here
//   3) add a "APPLE"/"LINKEDIN" entry to User.PROVIDERS
//
// All routing through this map keeps callers ignorant of vendor-specific code.
const registry = new Map([
  [GoogleProvider.name, new GoogleProvider()],
  [FacebookProvider.name, new FacebookProvider()],
]);

function getProvider(name) {
  const key = String(name || "").toUpperCase();
  const provider = registry.get(key);
  if (!provider) {
    throw new AppError(`Unsupported provider "${name}"`, 400, "OAUTH_UNSUPPORTED");
  }
  return provider;
}

function listProviderNames() {
  return Array.from(registry.keys());
}

module.exports = { getProvider, listProviderNames };
