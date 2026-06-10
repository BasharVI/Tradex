const { UAParser } = require("ua-parser-js");

// Distill a request into the info we want to surface to users in the
// "active sessions" UI. Falls back gracefully when the parser can't id
// the client.
function deviceInfo(req) {
  const userAgent = String(req.get("user-agent") || "").slice(0, 500);
  const ip =
    (req.get("x-forwarded-for") || "").split(",")[0].trim() ||
    req.ip ||
    req.connection?.remoteAddress ||
    "";

  let device = "Unknown device";
  try {
    const parsed = new UAParser(userAgent).getResult();
    const browser = parsed.browser?.name || "Browser";
    const os = parsed.os?.name || "OS";
    device = `${browser} on ${os}`;
  } catch {
    // keep fallback
  }
  return { userAgent, ip, device };
}

module.exports = deviceInfo;
