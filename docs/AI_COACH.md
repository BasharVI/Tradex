# TradeX AI Coach

## What ships

- AI trade review with grades `A+` through `D`
- AI portfolio review
- AI behavior analysis
- AI weekly report
- AI learning coach
- Provider abstraction for OpenAI, Claude, and Gemini
- Redis-backed cache, queue, and rate limiting
- Background worker for async analysis

## Backend architecture

### Service layer

- `BackEnd/src/services/ai/ai.service.js`
  - Orchestrates analysis generation, caching, persistence, and recommendations.
- `BackEnd/src/services/ai/promptTemplates.js`
  - Centralized prompt templates and versioning.
- `BackEnd/src/services/ai/providerFactory.js`
  - Chooses the provider implementation.
- `BackEnd/src/services/ai/providers/*`
  - Provider adapters for OpenAI, Claude, Gemini, and mock mode.

### Caching layer

- Redis cache stores normalized AI outputs using payload hashes.
- Cached responses avoid duplicate provider calls and do not burn rate-limit quota.

### Queue layer

- Trade reviews are queued after trade execution.
- Worker processes jobs from Redis and persists results.
- Weekly report batches are enqueued for active users with trades in the weekly window.

### Rate limiting

- Per-user AI limits are enforced in Redis.
- Limits are configurable by analysis type.

## API endpoints

- `GET /api/ai/overview`
- `GET /api/ai/trade/:tradeId`
- `POST /api/ai/trade/:tradeId/review`
- `POST /api/ai/trade/:tradeId/queue`
- `GET /api/ai/portfolio`
- `POST /api/ai/portfolio/review`
- `GET /api/ai/behavior`
- `POST /api/ai/behavior/analyze`
- `GET /api/ai/weekly`
- `POST /api/ai/weekly/generate`
- `GET /api/ai/learning`

## Database models

- `AIAnalysis`
- `BehaviorInsight`
- `PortfolioReview`
- `WeeklyReport`

## Cost estimates

These are operational estimates, not vendor quotes.

- Trade review: ~1 request per fill, but cache + queue reduce repeated spend.
- Portfolio review: low-frequency, typically user-driven.
- Behavior analysis: weekly cadence, capped by rate limit.
- Weekly report: one report per active user per week.
- Learning coach: cache-heavy, low marginal cost.

For 100,000 users:

- Assume 15% weekly active users = 15,000
- Assume 20% of weekly active users place at least one trade = 3,000 trade reviews/week
- Assume 10,000 weekly reports generated
- With caching and mock fallback, the system stays bounded by queued jobs and Redis throughput

## Scalability recommendations

- Run AI workers as separate processes from the API tier.
- Use multiple worker replicas behind the Redis queue.
- Keep provider timeouts short and retry with capped attempts.
- Store only final structured output in MongoDB; keep large transient payloads out of the database.
- Partition weekly batch enqueueing by week window and active-user cohorts.
- Prefer cached reads in the UI; only regenerate when the user requests fresh analysis.

## Frontend UX

- `Growth Hub` remains the habit loop surface.
- `AI Coach` is the dedicated analysis surface for:
  - trade review
  - portfolio review
  - behavior insights
  - weekly report
  - learning recommendations

