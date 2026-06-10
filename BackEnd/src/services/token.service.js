const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { jwt: jwtCfg, bcryptRounds } = require("../config/env");

function signAccessToken(userId) {
  return jwt.sign({ sub: String(userId), type: "access" }, jwtCfg.accessSecret, {
    expiresIn: jwtCfg.accessTtl,
  });
}

// Refresh tokens carry a `jti` so they can be rotated/revoked individually.
function signRefreshToken(userId) {
  const jti = crypto.randomBytes(16).toString("hex");
  const token = jwt.sign(
    { sub: String(userId), type: "refresh", jti },
    jwtCfg.refreshSecret,
    { expiresIn: jwtCfg.refreshTtl }
  );
  return { token, jti };
}

function verifyAccessToken(token) {
  return jwt.verify(token, jwtCfg.accessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, jwtCfg.refreshSecret);
}

async function hashRefreshJti(jti) {
  return bcrypt.hash(jti, bcryptRounds);
}

async function compareRefreshJti(jti, hash) {
  return bcrypt.compare(jti, hash);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashRefreshJti,
  compareRefreshJti,
};
