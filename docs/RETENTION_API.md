# TradeX Retention API

## Core routes

- `GET /api/retention/snapshot`
  - Returns streaks, current risk score, active challenges, achievements, and notifications.
- `GET /api/retention/journals`
  - Lists the user’s trade journal entries.
- `POST /api/retention/journals`
  - Creates a journal entry for a completed trade.
- `PATCH /api/retention/journals/:id`
  - Updates an existing journal entry.
- `DELETE /api/retention/journals/:id`
  - Deletes a journal entry.

## Risk score

- `GET /api/retention/risk-score`
  - Recomputes the current monthly score and stores a historical snapshot.
- `GET /api/retention/risk-score/history`
  - Returns historical stored risk scores.

## Streaks and engagement

- `POST /api/retention/learning/checkin`
  - Manually records a learning session for the learning streak.
- `GET /api/retention/challenges`
  - Returns the active daily challenges with progress.
- `GET /api/retention/achievements`
  - Returns unlocked and locked achievements.
- `GET /api/retention/notifications`
  - Lists retention notifications.
- `PATCH /api/retention/notifications/:id/read`
  - Marks a notification as read.

## Leaderboards

- `GET /api/retention/leaderboards?month=YYYY-MM`
  - Returns monthly rankings for:
    - Highest Return
    - Highest Risk Adjusted Return
    - Best Consistency

## Trade journal payload

```json
{
  "tradeId": "66c...",
  "orderId": "66c...",
  "symbol": "RELIANCE",
  "exchange": "NSE",
  "side": "BUY",
  "executedAt": "2026-06-10T09:30:00.000Z",
  "tradeSetup": "Breakout continuation",
  "entryReason": "Volume confirmation",
  "exitReason": "Booked into resistance",
  "riskLevel": "MEDIUM",
  "emotion": "CONFIDENT",
  "notes": "Kept size small and followed plan."
}
```

## Testing strategy

1. **Route smoke tests**
   - Hit every `GET` route with an authenticated user and verify `200`.
   - Verify journal create/update/delete with both valid and invalid payloads.
2. **Event-driven checks**
   - Place a trade and confirm:
     - trading streak updates,
     - challenge progress changes,
     - notifications are created,
     - achievements unlock when thresholds are crossed.
3. **Risk engine checks**
   - Seed a small trade set with known PnL and validate:
     - win rate,
     - profit factor,
     - average risk/reward,
     - max drawdown,
     - score bounds stay within `0-100`.
4. **Leaderboard checks**
   - Create multiple users with distinct monthly trade sets and confirm rank ordering.
5. **UI checks**
   - Load the Growth Hub page, submit a journal, and verify the new entry appears without a hard refresh.

