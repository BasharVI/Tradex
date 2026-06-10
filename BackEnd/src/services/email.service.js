const nodemailer = require("nodemailer");
const { email: emailCfg, appUrl } = require("../config/env");

// Singleton transporter. When EMAIL_HOST is unset (dev/test) we use the
// JSON transport, which logs each email to the console instead of sending.
// Switching to a real SMTP provider is a config change, not a code change.
let transporter = null;
function getTransport() {
  if (transporter) return transporter;
  if (!emailCfg.host) {
    transporter = nodemailer.createTransport({ jsonTransport: true });
    return transporter;
  }
  transporter = nodemailer.createTransport({
    host: emailCfg.host,
    port: emailCfg.port,
    secure: emailCfg.port === 465,
    auth: emailCfg.user
      ? { user: emailCfg.user, pass: emailCfg.pass }
      : undefined,
  });
  return transporter;
}

async function send({ to, subject, text, html }) {
  const info = await getTransport().sendMail({
    from: emailCfg.from,
    to,
    subject,
    text,
    html,
  });
  if (!emailCfg.host) {
    // eslint-disable-next-line no-console
    console.log(`[email:dev] -> ${to} :: ${subject}\n${text}`);
  }
  return info;
}

async function sendVerificationEmail(user, token) {
  const link = `${appUrl}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(user.email)}`;
  const text = `Hi ${user.displayName || user.username || ""},

Please verify your TradeX email by visiting:
${link}

This link expires soon. If you did not sign up, ignore this email.`;
  return send({
    to: user.email,
    subject: "Verify your TradeX email",
    text,
    html: `<p>Hi ${user.displayName || user.username || ""},</p>
<p>Please verify your TradeX email by clicking the link below:</p>
<p><a href="${link}">${link}</a></p>
<p>This link expires soon. If you did not sign up, ignore this email.</p>`,
  });
}

async function sendPasswordResetEmail(user, token) {
  const link = `${appUrl}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(user.email)}`;
  const text = `Hi ${user.displayName || user.username || ""},

You (or someone else) requested a password reset for your TradeX account.
Reset link: ${link}

This link expires shortly. If you didn't request this, you can ignore it — your password will not change.`;
  return send({
    to: user.email,
    subject: "Reset your TradeX password",
    text,
    html: `<p>Hi ${user.displayName || user.username || ""},</p>
<p>You (or someone else) requested a password reset for your TradeX account.</p>
<p><a href="${link}">${link}</a></p>
<p>This link expires shortly. If you didn't request this, ignore this email — your password will not change.</p>`,
  });
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
