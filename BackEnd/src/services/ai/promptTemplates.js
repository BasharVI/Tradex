const PROMPT_VERSION = "2026-06-10.v1";

function safeJson(obj) {
  return JSON.stringify(obj, null, 2);
}

function tradeReviewPrompt(payload) {
  return `
You are TradeX AI Trade Coach.
Return strict JSON only.

Evaluate the completed trade.
Trade:
${safeJson(payload.trade)}

Context:
${safeJson(payload.context)}

Rules:
- Grade must be one of A+, A, B, C, D.
- Analyze entry quality, exit quality, risk management, position size, reward-to-risk ratio.
- Include concise strengths, weaknesses, and recommendations.
- Keep summary practical and coaching-oriented.

Return JSON with keys:
{
  "grade": "",
  "summary": "",
  "strengths": [],
  "weaknesses": [],
  "recommendations": [],
  "signals": {
    "entryQuality": 0-100,
    "exitQuality": 0-100,
    "riskManagement": 0-100,
    "positionSize": 0-100,
    "rewardRisk": 0-100
  }
}
`;
}

function portfolioReviewPrompt(payload) {
  return `
You are TradeX AI Portfolio Coach.
Return strict JSON only.

Review the portfolio and suggest actions that improve diversification and risk control.
Portfolio:
${safeJson(payload.portfolio)}

Holdings:
${safeJson(payload.holdings)}

Rules:
- Focus on sector concentration, industry concentration, diversification, risk exposure, cash allocation.
- Prefer direct, actionable recommendations.

Return JSON with keys:
{
  "summary": "",
  "sectorConcentration": {},
  "industryConcentration": {},
  "diversification": {},
  "riskExposure": {},
  "cashAllocation": {},
  "recommendations": []
}
`;
}

function behaviorPrompt(payload) {
  return `
You are TradeX AI Behavior Coach.
Return strict JSON only.

Analyze historical trading behavior and detect patterns.
Trades:
${safeJson(payload.trades)}

Journal/Context:
${safeJson(payload.context)}

Detect:
- Revenge Trading
- Overtrading
- Holding Losers Too Long
- Cutting Winners Early
- FOMO Entries

Return JSON with keys:
{
  "insights": [],
  "recommendations": [],
  "behaviors": {
    "revengeTrading": 0-100,
    "overtrading": 0-100,
    "holdingLosersTooLong": 0-100,
    "cuttingWinnersEarly": 0-100,
    "fomoEntries": 0-100
  },
  "evidence": {}
}
`;
}

function weeklyReportPrompt(payload) {
  return `
You are TradeX AI Weekly Coach.
Return strict JSON only.

Weekly report:
${safeJson(payload)}

Return JSON with keys:
{
  "performanceSummary": "",
  "mistakeSummary": "",
  "improvementAreas": [],
  "riskMetrics": {},
  "recommendations": []
}
`;
}

function learningCoachPrompt(payload) {
  return `
You are TradeX AI Learning Coach.
Return strict JSON only.

Recommend educational content based on weaknesses and patterns.
Context:
${safeJson(payload)}

Return JSON with keys:
{
  "summary": "",
  "recommendations": [
    {
      "title": "",
      "reason": "",
      "format": "ARTICLE|VIDEO|CHECKLIST|PLAYBOOK",
      "priority": 1
    }
  ]
}
`;
}

module.exports = {
  PROMPT_VERSION,
  tradeReviewPrompt,
  portfolioReviewPrompt,
  behaviorPrompt,
  weeklyReportPrompt,
  learningCoachPrompt,
};
