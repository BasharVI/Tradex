const { OAuth2Client } = require("google-auth-library");
const Provider = require("./Provider");
const AppError = require("../../../utils/AppError");
const { oauth } = require("../../../config/env");

// Verifies a Google ID token (JWT) issued by Google Identity Services
// on the frontend. We don't run the full OAuth code-exchange dance because
// GIS hands us a verifiable ID token directly — simpler and equally secure.
class GoogleProvider extends Provider {
  static name = "GOOGLE";

  constructor() {
    super();
    this.clientId = oauth.google.clientId;
    this.client = this.clientId ? new OAuth2Client(this.clientId) : null;
  }

  async verify(idToken) {
    this.ensureConfigured(Boolean(this.client));
    let ticket;
    try {
      ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.clientId,
      });
    } catch {
      throw new AppError("Invalid Google credential", 401, "OAUTH_INVALID");
    }
    const payload = ticket.getPayload() || {};
    if (!payload.sub || !payload.email) {
      throw new AppError("Google profile missing required fields", 401, "OAUTH_INVALID");
    }
    return {
      providerUserId: String(payload.sub),
      email: String(payload.email).toLowerCase().trim(),
      emailVerified: Boolean(payload.email_verified),
      displayName: payload.name || payload.given_name || "",
      photoUrl: payload.picture || "",
    };
  }
}

module.exports = GoogleProvider;
