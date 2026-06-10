const axios = require("axios");
const crypto = require("crypto");
const Provider = require("./Provider");
const AppError = require("../../../utils/AppError");
const { oauth } = require("../../../config/env");

// Verifies a Facebook user access token (obtained client-side via the JS SDK).
// Two-step check:
//   1) /debug_token: confirms the token is valid AND was issued for OUR app.
//      Without the app-id check, an attacker could send a token issued to
//      a different FB app and impersonate that app's users.
//   2) /me: fetches the profile (id, name, email, picture).
// The `appsecret_proof` HMAC binds requests to our app secret, preventing
// stolen tokens from being used outside our backend.
class FacebookProvider extends Provider {
  static name = "FACEBOOK";

  constructor() {
    super();
    this.appId = oauth.facebook.appId;
    this.appSecret = oauth.facebook.appSecret;
  }

  appSecretProof(token) {
    return crypto
      .createHmac("sha256", this.appSecret)
      .update(token)
      .digest("hex");
  }

  async verify(accessToken) {
    this.ensureConfigured(Boolean(this.appId && this.appSecret));

    let debug;
    try {
      const { data } = await axios.get("https://graph.facebook.com/debug_token", {
        params: {
          input_token: accessToken,
          access_token: `${this.appId}|${this.appSecret}`,
        },
        timeout: 8000,
      });
      debug = data && data.data;
    } catch {
      throw new AppError("Failed to validate Facebook token", 401, "OAUTH_INVALID");
    }
    if (!debug || debug.is_valid !== true || String(debug.app_id) !== String(this.appId)) {
      throw new AppError("Invalid Facebook credential", 401, "OAUTH_INVALID");
    }

    let profile;
    try {
      const { data } = await axios.get("https://graph.facebook.com/me", {
        params: {
          fields: "id,name,email,picture.type(large)",
          access_token: accessToken,
          appsecret_proof: this.appSecretProof(accessToken),
        },
        timeout: 8000,
      });
      profile = data;
    } catch {
      throw new AppError("Failed to load Facebook profile", 401, "OAUTH_INVALID");
    }

    if (!profile || !profile.id) {
      throw new AppError("Facebook profile missing required fields", 401, "OAUTH_INVALID");
    }
    if (!profile.email) {
      // Users can deny the email permission. We require email for account
      // linking and password-reset flows.
      throw new AppError(
        "Facebook account must share an email address with TradeX",
        400,
        "OAUTH_EMAIL_REQUIRED"
      );
    }

    return {
      providerUserId: String(profile.id),
      email: String(profile.email).toLowerCase().trim(),
      // Facebook only returns verified emails through the Graph API.
      emailVerified: true,
      displayName: profile.name || "",
      photoUrl: (profile.picture && profile.picture.data && profile.picture.data.url) || "",
    };
  }
}

module.exports = FacebookProvider;
