# TradeX Authentication & Onboarding

This document describes the production-grade auth subsystem rolled out in this
revision. It covers the architecture, every change applied to the database,
backend and frontend, the migration path from the previous schema, and a
testing strategy.

---

## 1. High-level architecture

```
              ┌──────────────────────────── Frontend (React) ───────────────────────────┐
              │                                                                          │
              │   Login / Signup  ──► /auth/login | /auth/signup | /auth/oauth/{p}        │
              │   ForgotPassword  ──► /auth/forgot-password                              │
              │   ResetPassword   ──► /auth/reset-password                               │
              │   VerifyEmail     ──► /auth/verify-email                                 │
              │   Onboarding (5)  ──► /auth/onboarding (per step)                        │
              │   Profile         ──► /profile (GET, PATCH)                              │
              │   Sessions        ──► /auth/sessions  (GET, DELETE, revoke-all)          │
              │                                                                          │
              │   Access Token  (Bearer header)  -  in memory + localStorage             │
              │   Refresh Token (httpOnly cookie) -  inaccessible to JS                  │
              │   CSRF Token    (cookie + x-csrf-token header)                           │
              │                                                                          │
              └──────────────────────────────────────────────────────────────────────────┘
                                            │
                                            ▼
              ┌────────────────────────── Backend (Express) ─────────────────────────────┐
              │                                                                          │
              │   /api/auth/* routes ───► auth.service  ───► token.service               │
              │                                  │                                       │
              │                                  ▼                                       │
              │   /api/auth/oauth/:p ──► providers (Google, Facebook, …)                 │
              │                                                                          │
              │   email.service  -  nodemailer (real SMTP or dev console transport)     │
              │   middleware     -  validate(Joi), requireAuth(JWT), requireCsrf,        │
              │                     rate-limit (per IP+identifier)                       │
              │                                                                          │
              └──────────────────────────────────────────────────────────────────────────┘
                                            │
                                            ▼
              ┌─────────────────────────── MongoDB (User) ───────────────────────────────┐
              │  identity, profile, onboarding, oauthIdentities[],                       │
              │  refreshTokens[] (jtiHash, expiresAt, ip, ua, device),                   │
              │  failedLoginAttempts, lockedUntil, emailVerified,                        │
              │  emailVerifyTokenHash, passwordResetTokenHash                            │
              └──────────────────────────────────────────────────────────────────────────┘
```

### Token strategy

| Token          | Lifetime | Storage                                | Purpose                       |
|----------------|----------|----------------------------------------|-------------------------------|
| Access JWT     | 15 m     | localStorage (XSS-impactful but short) | Bearer auth on API calls      |
| Refresh JWT    | 7 d      | **httpOnly + Secure + SameSite=Strict** cookie | Rotated on every refresh; reuse-detected |
| CSRF token     | 7 d      | non-httpOnly cookie + `x-csrf-token` header (double-submit) | Guard for cookie-auth refresh / logout |
| Email verify   | 24 h     | SHA-256 hashed in DB                   | Single-use, randomised opaque token |
| Password reset | 30 m     | SHA-256 hashed in DB                   | Single-use, randomised opaque token, invalidates all sessions on use |

Refresh tokens are tracked **server-side** (`User.refreshTokens[]`). Each entry
keeps `jtiHash`, `ip`, `userAgent`, `device` + `expiresAt`, so we can:

* list active sessions in the Profile UI,
* revoke any one (or all) sessions,
* rotate on every refresh and detect token reuse — if a refresh comes in whose
  `jti` is no longer in the allowlist we **revoke everything** on that user.

### Social login

Defined under `BackEnd/src/services/auth/providers/`. A new provider is added
in three steps (see the **Future providers** section below).

---

## 2. Database changes

`User` schema additions (all backwards-compatible defaults):

| Field                  | Type                            | Notes                                    |
|------------------------|----------------------------------|------------------------------------------|
| `password`             | now `select:false` & optional    | OAuth-only users have no password        |
| `emailVerified`        | Boolean (default `false`)        | Flips true after verify-email or OAuth   |
| `primaryProvider`      | enum `LOCAL/GOOGLE/FACEBOOK/APPLE/LINKEDIN` | What the user first signed up with |
| `oauthIdentities[]`    | `{ provider, providerUserId, linkedAt }` | Unique partial-index per pair |
| `failedLoginAttempts`  | Number                           | Reset on success / lockout               |
| `lockedUntil`          | Date                             | If `> now` login is rejected             |
| `lastLoginAt`/`lastLoginIp` | Date / String              | Audit                                    |
| `emailVerifyTokenHash`/`emailVerifyExpiresAt` | String / Date — `select:false` | SHA-256 of opaque token |
| `passwordResetTokenHash`/`passwordResetExpiresAt` | String / Date — `select:false` | SHA-256 of opaque token |
| `displayName`          | String (<= 60)                   | Profile                                  |
| `bio`                  | String (<= 280)                  | Profile                                  |
| `photoUrl`             | String (URL, <= 500)             | Profile                                  |
| `experienceLevel`      | enum `BEGINNER/INTERMEDIATE/ADVANCED` | Onboarding step 2                  |
| `riskAppetite`         | enum `LOW/MEDIUM/HIGH`           | Profile step 5                            |
| `goals[]`              | enum array of `LEARN_INVESTING/LEARN_TRADING/BUILD_PORTFOLIO/COMPETE_WITH_OTHERS` | Onboarding step 3 |
| `onboarding`           | `{ completed, step, completedAt }` | Step 0..5, gates `/dashboard`         |
| `refreshTokens[]`      | added `ip`, `userAgent`, `device`, `lastUsedAt` | per-session device list  |

`User.startingCapital` and `availableCash` remain authoritative — onboarding
step 4 only allows changing them **before** completion, and we write an
`ADJUSTMENT` row to `FundLedger` so the cash book remains auditable.

---

## 3. Backend changes (file map)

| File | Purpose |
|------|---------|
| `BackEnd/.env.example` | New env vars: `APP_URL`, `REFRESH_COOKIE_NAME`, `CSRF_COOKIE_NAME`, `COOKIE_SECURE`, `COOKIE_SAMESITE`, `LOCKOUT_*`, `EMAIL_VERIFY_TTL_HOURS`, `PASSWORD_RESET_TTL_MIN`, `GOOGLE_CLIENT_ID/SECRET`, `FACEBOOK_APP_ID/SECRET`, `EMAIL_*` |
| `BackEnd/src/config/env.js` | Surfaces new env vars to runtime; sensible defaults |
| `BackEnd/src/models/User.js` | Schema overhaul (above) |
| `BackEnd/src/services/token.service.js` | Adds cookie helpers, CSRF issuance, SHA-256 opaque-token hashing |
| `BackEnd/src/services/auth.service.js` | publicUser, issueSession, lockout, email-verify, password-reset |
| `BackEnd/src/services/email.service.js` | nodemailer wrapper (dev = console transport) |
| `BackEnd/src/services/auth/providers/Provider.js` | Abstract base |
| `BackEnd/src/services/auth/providers/GoogleProvider.js` | Verifies Google ID tokens via `google-auth-library` |
| `BackEnd/src/services/auth/providers/FacebookProvider.js` | Verifies FB user tokens via `debug_token` + `me?fields=…&appsecret_proof=…` |
| `BackEnd/src/services/auth/providers/index.js` | Registry / factory |
| `BackEnd/src/middleware/csrf.js` | Double-submit cookie guard |
| `BackEnd/src/utils/deviceInfo.js` | UA-Parser-JS friendly device extraction |
| `BackEnd/src/validators/auth.schema.js` | Joi schemas for every new endpoint |
| `BackEnd/src/routes/auth.routes.js` | Overhauled — signup/login/refresh/logout/me + verify-email, resend-verification, forgot-password, reset-password, oauth/:provider, oauth/providers, sessions GET/DELETE/revoke-all, onboarding |
| `BackEnd/src/routes/profile.routes.js` | `GET /api/profile`, `PATCH /api/profile` |
| `BackEnd/src/app.js` | `cookie-parser`, CORS `credentials:true`, mount profile routes |
| `BackEnd/src/scripts/migrate-auth.js` | Backfill script (idempotent, `--dry-run` supported) |
| `BackEnd/package.json` | New deps: `google-auth-library`, `nodemailer`, `ua-parser-js` |

---

## 4. Frontend changes (file map)

| File | Purpose |
|------|---------|
| `FrontEnd/src/lib/api.js` | `credentials:'include'`, CSRF header mirror, removed refresh-token from localStorage |
| `FrontEnd/src/lib/socialSdk.js` | Lazy loaders for Google Identity Services / Facebook SDK |
| `FrontEnd/src/components/auth/SocialLogin.js` | Buttons for configured providers |
| `FrontEnd/src/components/PrivateComponent.js` | Redirects to `/onboarding` when not completed |
| `FrontEnd/src/components/Header.js` | Profile link + avatar |
| `FrontEnd/src/pages/Login.js` | Redesigned: forgot-password link, social buttons |
| `FrontEnd/src/pages/Signup.js` | Redesigned: routes to onboarding |
| `FrontEnd/src/pages/ForgotPassword.js` | New |
| `FrontEnd/src/pages/ResetPassword.js` | New |
| `FrontEnd/src/pages/VerifyEmail.js` | New |
| `FrontEnd/src/pages/Onboarding.js` | 5-step wizard |
| `FrontEnd/src/pages/Profile.js` | Profile editor + active sessions UI + resend verification |
| `FrontEnd/src/App.js` | Routes for the new pages |
| `FrontEnd/src/App.css` | Styles for auth/onboarding/profile/sessions |

---

## 5. Migration steps

### 5.1 Code

```bash
# Backend
cd BackEnd
npm install               # picks up google-auth-library, nodemailer, ua-parser-js
cp .env.example .env      # then fill in the new vars (see below)

# Frontend
cd ../FrontEnd
npm install               # no new deps; only config
```

### 5.2 Environment variables

The variables below are **new** — see `BackEnd/.env.example` for the full list:

* `APP_URL` — used in verification & reset email links
* `COOKIE_SECURE=true` and `COOKIE_SAMESITE=lax|strict|none` — pick per environment
* `LOCKOUT_MAX_ATTEMPTS`, `LOCKOUT_DURATION_MIN`
* `EMAIL_VERIFY_TTL_HOURS`, `PASSWORD_RESET_TTL_MIN`
* `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
* `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`
* `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`

Frontend (`FrontEnd/.env`):

* `REACT_APP_GOOGLE_CLIENT_ID`
* `REACT_APP_FACEBOOK_APP_ID`

Leave blank to disable that provider — the SocialLogin component hides
unconfigured buttons.

### 5.3 Database

```bash
cd BackEnd
npm run migrate:auth:dry   # preview
npm run migrate:auth       # apply
```

The script is **idempotent** — re-runs are no-ops. It:

1. Backfills `displayName` from `username`,
2. Marks pre-existing users `emailVerified: true` (so they aren't forced
   through verification on next login),
3. Marks pre-existing users `onboarding.completed: true` (so they skip the
   wizard),
4. Defaults `primaryProvider` to `LOCAL`,
5. Drops any pre-existing `refreshTokens` entries missing the new metadata —
   those users will just need to log in again.

### 5.4 OAuth setup

**Google:** in https://console.cloud.google.com/apis/credentials create an
OAuth 2.0 *Web application* client. Add `http://localhost:3000` (dev) and your
production origin to *Authorized JavaScript origins*. Paste the client ID into
`GOOGLE_CLIENT_ID` and `REACT_APP_GOOGLE_CLIENT_ID`.

**Facebook:** in https://developers.facebook.com/apps add the *Facebook Login
for the Web* product. Configure your domain. Copy the App ID & App Secret
into `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` (backend) and
`REACT_APP_FACEBOOK_APP_ID` (frontend).

---

## 6. Adding a new provider (Apple, LinkedIn, …)

1. Create `BackEnd/src/services/auth/providers/AppleProvider.js` extending
   `Provider` and implementing `async verify(rawCredential)` that returns a
   normalised profile (`{ providerUserId, email, emailVerified, displayName,
   photoUrl }`).
2. Register the instance in
   `BackEnd/src/services/auth/providers/index.js`.
3. Add `"APPLE"` to `PROVIDERS` in `BackEnd/src/models/User.js`.

The auth route (`POST /api/auth/oauth/:provider`) is provider-agnostic — no
route changes required.

---

## 7. Security checklist (what this revision delivers)

* **Rate limiting:** per-IP + per-identifier on `/login`, `/signup`,
  `/oauth/*`, `/forgot-password`, `/reset-password`, `/resend-verification`.
* **Account-lockout:** N failed logins → lockout for M minutes (`423` with
  `ACCOUNT_LOCKED`).
* **Refresh-token reuse detection:** a refresh with a known signature but a
  missing `jti` revokes all sessions.
* **CSRF protection:** double-submit cookie + header check on `/auth/refresh`
  and `/auth/logout` (the only endpoints that accept cookie-based auth).
* **XSS exfiltration mitigation:** refresh token is httpOnly. Access token is
  short-lived and worth at most 15 minutes if leaked.
* **Password policy:** ≥ 8 chars, must contain a letter and a digit (enforced
  client-side and server-side).
* **User-enumeration safety:** `/login`, `/forgot-password`,
  `/resend-verification` return uniform responses whether the email exists.
* **Token hashing:** refresh `jti` is bcrypted; email-verify and
  password-reset opaque tokens are SHA-256'd at rest.
* **Input validation:** every endpoint is validated by a Joi schema
  (`stripUnknown: true`).
* **Device tracking:** each session row holds `ip`, `userAgent`, `device` and
  surfaces in the Profile UI for review/revocation.
* **Session control:** users can revoke any single session or all sessions
  (password reset also revokes all).
* **Helmet** is applied; CORS is allow-list with credentials enabled.

---

## 8. Testing strategy

### 8.1 Unit (model + services)

Target the pure logic without I/O:

* `services/auth.service.js`
  * `assertNotLocked` throws when `lockedUntil > now`
  * `registerFailedLogin` increments and locks at `LOCKOUT_MAX_ATTEMPTS`
  * `issueEmailVerificationToken` / `consumeEmailVerificationToken`
    round-trips and rejects expired/mutated tokens
  * `consumePasswordResetToken` rejects mismatch / expired token
* `services/auth/providers/GoogleProvider`
  * Returns a normalised profile when `verifyIdToken` resolves
  * Throws `OAUTH_INVALID` (401) when the SDK throws
* `services/auth/providers/FacebookProvider`
  * Rejects tokens whose `app_id` doesn't match (stub axios)
  * Rejects when email permission is missing
* `services/token.service`
  * `signAccessToken` / `verifyAccessToken` round-trip with correct `type`
  * `hashOpaqueToken` is stable and length-32

Tools: `jest`, `sinon` for axios stubbing, `mongodb-memory-server` for the
model.

### 8.2 Integration (routes via supertest)

Spin up the express app against `mongodb-memory-server` and:

* `POST /api/auth/signup` 201 → user has `onboarding.completed=false`,
  `emailVerified=false`. A verify email is enqueued.
* `POST /api/auth/login` with wrong password 5× → 6th attempt returns 423.
* `POST /api/auth/refresh` rotates the cookie; the **old** cookie is rejected
  next time (reuse → all sessions wiped).
* `POST /api/auth/forgot-password` then `POST /api/auth/reset-password` →
  user can log in with the new password, prior sessions are gone.
* `POST /api/auth/onboarding` step by step → `onboarding.completed` flips on
  step 5, `startingCapital` adjustment writes a `FundLedger` row.
* `GET /api/auth/sessions` after two logins from different UAs returns two
  rows; `DELETE /api/auth/sessions/:id` removes one.
* `POST /api/auth/oauth/:provider` with a stubbed provider → user created
  with `emailVerified=true` and `primaryProvider=GOOGLE/FACEBOOK`.
* CSRF: `POST /api/auth/refresh` without matching `x-csrf-token` header → 403.

### 8.3 End-to-end (Playwright/Cypress)

* Sign up via form → redirected to `/onboarding` step 1.
* Complete steps 2..5 → land on `/dashboard`.
* Sign out → `/login`. Sign in again with same credentials.
* "Forgot password" → check console transport log for the link → reset
  password → log in.
* Profile page lists 1+ sessions; "Sign out everywhere" returns to `/login`.
* Social login (mock GIS in test) lands at `/dashboard` for a returning user
  and `/onboarding` for a new user.

### 8.4 Manual smoke

1. Start dev backend (`npm run dev`).
2. Start dev frontend (`npm start`).
3. Sign up → email link appears in backend console (because `EMAIL_HOST` is
   blank in dev). Open it.
4. Walk through onboarding. Verify capital adjustment shows in the dashboard.
5. From a second browser/incognito, log in → both sessions show in Profile.
6. Revoke the first session; verify the first browser is forced to re-auth
   on next API call.
