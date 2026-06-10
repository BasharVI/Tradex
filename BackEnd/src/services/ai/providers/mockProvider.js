class MockAIProvider {
  constructor() {
    this.name = "mock";
    this.model = "mock";
  }

  async generateJson(prompt) {
    const hasTrade = /Trade:/.test(prompt);
    if (hasTrade) {
      return {
        grade: "B",
        summary: "The trade was acceptable but execution discipline can improve.",
        strengths: ["Defined entry", "Managed size reasonably"],
        weaknesses: ["Exit could be sharper", "Risk/reward was only average"],
        recommendations: ["Tighten stop placement", "Use partial profit-taking"],
        signals: {
          entryQuality: 70,
          exitQuality: 62,
          riskManagement: 68,
          positionSize: 74,
          rewardRisk: 66,
        },
      };
    }
    if (/Portfolio:/.test(prompt)) {
      return {
        summary: "Portfolio is moderately diversified, but concentration remains elevated.",
        sectorConcentration: { "Financials": 28, "IT": 24 },
        industryConcentration: { "Banks": 21, "Software": 18 },
        diversification: { score: 62, note: "Add more uncorrelated exposure." },
        riskExposure: { score: 58, note: "Reduce single-theme concentration." },
        cashAllocation: { score: 71, note: "Healthy buffer; deploy selectively." },
        recommendations: ["Trim the largest sector exposure", "Add 2-3 uncorrelated holdings"],
      };
    }
    if (/Trades:/.test(prompt)) {
      return {
        insights: ["Revenge trading appears after losing sessions.", "FOMO entries cluster near market opens."],
        recommendations: ["Set a max trade count per day", "Wait for a 5-minute confirmation candle"],
        behaviors: {
          revengeTrading: 72,
          overtrading: 61,
          holdingLosersTooLong: 55,
          cuttingWinnersEarly: 64,
          fomoEntries: 70,
        },
        evidence: { sampleSize: 25 },
      };
    }
    if (/Weekly report/i.test(prompt) || /Weekly report:/.test(prompt)) {
      return {
        performanceSummary: "You ended the week slightly positive with better execution than the prior week.",
        mistakeSummary: "The main issue was position oversizing after wins.",
        improvementAreas: ["Right-size positions", "Keep losses small", "Avoid chasing late breakouts"],
        riskMetrics: { winRate: 54, profitFactor: 1.28, maxDrawdown: 4.2 },
        recommendations: ["Cap risk at 1% per trade", "Journal every exit within 5 minutes"],
      };
    }
    return {
      summary: "Keep studying your process.",
      recommendations: [{ title: "Trading Psychology 101", reason: "Improve decision quality", format: "ARTICLE", priority: 1 }],
    };
  }
}

module.exports = MockAIProvider;
