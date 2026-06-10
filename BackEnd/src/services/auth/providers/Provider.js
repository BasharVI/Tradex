const AppError = require("../../../utils/AppError");

// Base class for every social-login provider. Subclasses must:
//   * declare a static `name` matching the User.primaryProvider enum value
//   * implement `verify(rawCredential, opts)` → returns NormalizedProfile
//
// NormalizedProfile shape:
//   {
//     providerUserId: string,   // stable id assigned by the provider
//     email: string,            // verified email (lowercase, trimmed)
//     emailVerified: boolean,
//     displayName: string,
//     photoUrl: string,
//   }
//
// Subclasses should throw an AppError(401, "OAUTH_INVALID") if the
// credential is bad and AppError(500, "OAUTH_MISCONFIGURED") if the
// integration is not set up.
class Provider {
  constructor() {
    if (new.target === Provider) {
      throw new Error("Provider is abstract");
    }
  }

  /* eslint-disable-next-line no-unused-vars */
  async verify(rawCredential, opts = {}) {
    throw new AppError("Provider.verify not implemented", 500, "INTERNAL_ERROR");
  }

  ensureConfigured(configured) {
    if (!configured) {
      throw new AppError(
        `${this.constructor.name} is not configured on the server`,
        500,
        "OAUTH_MISCONFIGURED"
      );
    }
  }
}

module.exports = Provider;
