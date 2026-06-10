const mongoose = require("mongoose");
const Trade = require("../models/Trade");
const User = require("../models/User");
const TradeJournal = require("../models/TradeJournal");
const RiskScoreHistory = require("../models/RiskScoreHistory");
const EngagementState = require("../models/EngagementState");
const Challenge = require("../models/Challenge");
const ChallengeProgress = require("../models/ChallengeProgress");
const Achievement = require("../models/Achievement");
const UserAchievement = require("../models/UserAchievement");
const Notification = require("../models/Notification");
const Holding = require("../models/Holding");
const AppError = require("../utils/AppError");
const { createNotification } = require("./notification.service");

const DEFAULT_CHALLENGES = [
  {
    slug: "earn-1-percent",
    title: "Earn 1%",
    description: "Close the day up by at least 1%.",
    challengeType: "RETURN",
    targetValue: 1,
    unit: "%",
    rewardPoints: 50,
    sortOrder: 1,
  },
  {
    slug: "complete-3-trades",
    title: "Complete 3 Trades",
    description: "Execute 3 trades today.",
    challengeType: "TRADE_COUNT",
    targetValue: 3,
    unit: "trades",
    rewardPoints: 40,
    sortOrder: 2,
  },
  {
    slug: "risk-below-2",
    title: "Keep Risk Below 2%",
    description: "Keep the biggest position below 2% of capital.",
    challengeType: "RISK_LIMIT",
    targetValue: 2,
    unit: "%",
    rewardPoints: 60,
    sortOrder: 3,
  },
];

const DEFAULT_ACHIEVEMENTS = [
  {
    slug: "first-trade",
    title: "First Trade",
    description: "Place your first trade.",
    criteriaType: "FIRST_TRADE",
    targetValue: 1,
    rewardPoints: 20,
    sortOrder: 1,
  },
  {
    slug: "10-trades",
    title: "10 Trades",
    description: "Reach 10 completed trades.",
    criteriaType: "TRADE_COUNT",
    targetValue: 10,
    rewardPoints: 50,
    sortOrder: 2,
  },
  {
    slug: "100-trades",
    title: "100 Trades",
    description: "Reach 100 completed trades.",
    criteriaType: "TRADE_COUNT",
    targetValue: 100,
    rewardPoints: 200,
    sortOrder: 3,
  },
  {
    slug: "first-profitable-week",
    title: "First Profitable Week",
    description: "Finish a 7-day window in profit.",
    criteriaType: "PROFITABLE_WEEK",
    targetValue: 1,
    rewardPoints: 100,
    sortOrder: 4,
  },
  {
    slug: "portfolio-doubled",
    title: "Portfolio Doubled",
    description: "Grow the portfolio to 2x starting capital.",
    criteriaType: "PORTFOLIO_DBL",
    targetValue: 2,
    rewardPoints: 250,
    sortOrder: 5,
  },
];

const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;
const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dateKey(date = new Date()) {
  return startOfUtcDay(date).toISOString().slice(0, 10);
}

function nextDay(date) {
  return new Date(startOfUtcDay(date).getTime() + 24 * 60 * 60 * 1000);
}

function dayDiff(a, b) {
  return Math.round((startOfUtcDay(b).getTime() - startOfUtcDay(a).getTime()) / 86400000);
}

function monthRange(month) {
  const [year, m] = String(month || "").split("-").map(Number);
  if (!year || !m) return null;
  const start = new Date(Date.UTC(year, m - 1, 1));
  const end = new Date(Date.UTC(year, m, 1));
  return { start, end };
}

async function ensureTemplates() {
  await Promise.all([
    ...DEFAULT_CHALLENGES.map((challenge) =>
      Challenge.updateOne({ slug: challenge.slug }, { $setOnInsert: challenge }, { upsert: true })
    ),
    ...DEFAULT_ACHIEVEMENTS.map((achievement) =>
      Achievement.updateOne({ slug: achievement.slug }, { $setOnInsert: achievement }, { upsert: true })
    ),
  ]);
}

async function getEngagementState(userId) {
  let state = await EngagementState.findOne({ userId });
  if (!state) {
    state = await EngagementState.create({ userId });
  }
  return state;
}

async function saveStreak(state, field, date, pointsForUpdate = 0, rewardTag = "") {
  const streak = state[field];
  const currentDay = startOfUtcDay(date);
  const lastAt = streak.lastAt ? startOfUtcDay(streak.lastAt) : null;
  const sameDay = lastAt && lastAt.getTime() === currentDay.getTime();

  if (sameDay) {
    return { changed: false, streak };
  }

  if (lastAt && dayDiff(lastAt, currentDay) === 1) {
    streak.count += 1;
  } else {
    streak.count = 1;
  }

  streak.best = Math.max(streak.best || 0, streak.count);
  streak.lastAt = currentDay;
  state.rewardPoints += pointsForUpdate;

  const milestones = [3, 5, 7, 10, 14, 30, 50];
  const reachedMilestone = milestones.includes(streak.count);

  if (reachedMilestone) {
    state.rewardPoints += Math.min(100, streak.count * 2);
  }

  await state.save();

  if (pointsForUpdate > 0 || reachedMilestone) {
    await createNotification(state.userId, {
      type: "STREAK",
      title: `${rewardTag} streak updated`,
      message: `${rewardTag} streak is now ${streak.count} day${streak.count === 1 ? "" : "s"}.`,
      metadata: { field, streak: streak.count, milestone: reachedMilestone },
    });
  }

  return { changed: true, streak };
}

async function recordLoginEvent(userId, date = new Date()) {
  const state = await getEngagementState(userId);
  return saveStreak(state, "login", date, 5, "Login");
}

async function recordLearningEvent(userId, date = new Date()) {
  const state = await getEngagementState(userId);
  return saveStreak(state, "learning", date, 5, "Learning");
}

async function recomputeTradingStreak(userId) {
  const trades = await Trade.find({ userId }).select("executedAt").sort({ executedAt: 1 }).lean();
  const state = await getEngagementState(userId);
  let count = 0;
  let best = 0;
  let lastAt = null;
  let previousDay = null;

  for (const trade of trades) {
    const currentDay = startOfUtcDay(trade.executedAt);
    if (previousDay && currentDay.getTime() === previousDay.getTime()) {
      continue;
    }
    if (!previousDay || dayDiff(previousDay, currentDay) === 1) {
      count += 1;
    } else {
      count = 1;
    }
    best = Math.max(best, count);
    previousDay = currentDay;
    lastAt = currentDay;
  }

  state.trading = { count, best, lastAt };
  state.rewardPoints += trades.length ? 10 : 0;
  await state.save();
  return state.trading;
}

async function recomputeGreenDayStreak(userId) {
  const trades = await Trade.find({ userId })
    .select("executedAt realizedPnL")
    .sort({ executedAt: 1 })
    .lean();
  const state = await getEngagementState(userId);
  const byDay = new Map();
  for (const trade of trades) {
    const key = dateKey(trade.executedAt);
    byDay.set(key, round2((byDay.get(key) || 0) + Number(trade.realizedPnL || 0)));
  }

  const days = Array.from(byDay.keys()).sort();
  let count = 0;
  let best = 0;
  let lastAt = null;
  let previous = null;

  for (const key of days) {
    const pnl = byDay.get(key);
    if (pnl <= 0) {
      count = 0;
      previous = null;
      continue;
    }
    const current = new Date(`${key}T00:00:00.000Z`);
    if (!previous || dayDiff(previous, current) === 1) {
      count += 1;
    } else {
      count = 1;
    }
    best = Math.max(best, count);
    previous = current;
    lastAt = current;
  }

  state.greenDay = { count, best, lastAt };
  await state.save();
  return state.greenDay;
}

async function recordTradeEvent(userId, trade) {
  const state = await getEngagementState(userId);
  const tradeDay = startOfUtcDay(trade.executedAt || new Date());
  const tradeDayKey = dateKey(tradeDay);
  const currentTrading = state.trading;
  const lastTradingDay = currentTrading.lastAt ? startOfUtcDay(currentTrading.lastAt) : null;

  if (!lastTradingDay || dayDiff(lastTradingDay, tradeDay) > 0) {
    if (lastTradingDay && dayDiff(lastTradingDay, tradeDay) === 1) {
      currentTrading.count += 1;
    } else {
      currentTrading.count = 1;
    }
    currentTrading.best = Math.max(currentTrading.best || 0, currentTrading.count);
    currentTrading.lastAt = tradeDay;
  }

  state.rewardPoints += 10;
  await state.save();
  await createNotification(userId, {
    type: "STREAK",
    title: "Trading streak updated",
    message: `You traded on ${tradeDayKey}. Trading streak is now ${currentTrading.count} day${currentTrading.count === 1 ? "" : "s"}.`,
    metadata: { streak: currentTrading.count, tradeId: String(trade._id || ""), symbol: trade.symbol },
  });

  await recomputeGreenDayStreak(userId);
  await evaluateChallenges(userId, trade.executedAt || new Date());
  await evaluateAchievements(userId);
  return getEngagementState(userId);
}

async function getJournalEntries(userId) {
  return TradeJournal.find({ userId }).sort({ executedAt: -1 }).limit(200).lean();
}

async function createJournalEntry(userId, payload) {
  const doc = await TradeJournal.create({
    userId,
    ...payload,
  });
  return doc;
}

async function updateJournalEntry(userId, id, payload) {
  const doc = await TradeJournal.findOneAndUpdate(
    { _id: id, userId },
    { $set: payload },
    { new: true }
  );
  if (!doc) throw new AppError("Journal entry not found", 404, "JOURNAL_NOT_FOUND");
  return doc;
}

async function deleteJournalEntry(userId, id) {
  const result = await TradeJournal.deleteOne({ _id: id, userId });
  if (!result.deletedCount) throw new AppError("Journal entry not found", 404, "JOURNAL_NOT_FOUND");
  return { ok: true };
}

function scoreRiskMetrics(trades, startingCapital) {
  const closedTrades = trades.filter((trade) => Number(trade.realizedPnL || 0) !== 0);
  const wins = closedTrades.filter((trade) => Number(trade.realizedPnL || 0) > 0);
  const losses = closedTrades.filter((trade) => Number(trade.realizedPnL || 0) < 0);
  const grossProfit = wins.reduce((sum, trade) => sum + Number(trade.realizedPnL || 0), 0);
  const grossLoss = Math.abs(losses.reduce((sum, trade) => sum + Number(trade.realizedPnL || 0), 0));
  const winRate = closedTrades.length ? (wins.length / closedTrades.length) * 100 : 0;
  const profitFactor = grossLoss ? grossProfit / grossLoss : grossProfit > 0 ? 9.99 : 0;
  const averageWin = wins.length ? grossProfit / wins.length : 0;
  const averageLoss = losses.length ? grossLoss / losses.length : 0;
  const averageRiskReward = averageLoss ? averageWin / averageLoss : averageWin > 0 ? 9.99 : 0;

  let peak = 0;
  let equity = 0;
  let maxDrawdown = 0;
  for (const trade of trades) {
    equity += Number(trade.realizedPnL || 0);
    peak = Math.max(peak, equity);
    if (peak > 0) {
      maxDrawdown = Math.max(maxDrawdown, (peak - equity) / Math.max(peak, startingCapital || 1));
    }
  }

  const disciplinedTrades = trades.filter((trade) => {
    const turnover = Number(trade.turnover || 0);
    return turnover <= Number(startingCapital || 1) * 0.02;
  }).length;
  const positionSizingDiscipline = trades.length ? (disciplinedTrades / trades.length) * 100 : 0;

  const normalizedProfitFactor = clamp((profitFactor / 2) * 100);
  const normalizedRR = clamp((averageRiskReward / 3) * 100);
  const drawdownScore = clamp(100 - maxDrawdown * 400);

  const score = Math.round(
    winRate * 0.3 +
      normalizedProfitFactor * 0.2 +
      normalizedRR * 0.15 +
      drawdownScore * 0.15 +
      positionSizingDiscipline * 0.2
  );

  return {
    metrics: {
      winRate: round2(winRate),
      profitFactor: round2(profitFactor),
      averageRiskReward: round2(averageRiskReward),
      maxDrawdown: round2(maxDrawdown * 100),
      positionSizingDiscipline: round2(positionSizingDiscipline),
    },
    score: clamp(score),
  };
}

async function getRiskScore(userId, range = {}) {
  const now = new Date();
  const defaultStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const defaultEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const monthWindow = range.month ? monthRange(range.month) : null;
  const periodStart = range.start ? new Date(range.start) : monthWindow?.start || defaultStart;
  const periodEnd = range.end ? new Date(range.end) : monthWindow?.end || defaultEnd;
  const trades = await Trade.find({
    userId,
    executedAt: { $gte: periodStart, $lt: periodEnd },
  })
    .sort({ executedAt: 1 })
    .lean();

  const user = await User.findById(userId).select("startingCapital").lean();
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  const snapshot = scoreRiskMetrics(trades, user.startingCapital);
  const doc = await RiskScoreHistory.findOneAndUpdate(
    { userId, periodStart, periodEnd },
    {
      $set: {
        computedAt: new Date(),
        tradesCount: trades.length,
        metrics: snapshot.metrics,
        score: snapshot.score,
      },
      $setOnInsert: { userId, periodStart, periodEnd },
    },
    { new: true, upsert: true }
  );

  return {
    periodStart,
    periodEnd,
    tradesCount: trades.length,
    metrics: snapshot.metrics,
    score: snapshot.score,
    historyId: String(doc._id),
  };
}

async function getRiskHistory(userId, limit = 12) {
  return RiskScoreHistory.find({ userId }).sort({ periodEnd: -1 }).limit(limit).lean();
}

function leaderboardMetrics(trades, startingCapital) {
  const pnl = trades.reduce((sum, trade) => sum + Number(trade.realizedPnL || 0), 0);
  const returnPct = startingCapital ? (pnl / startingCapital) * 100 : 0;
  const dailyEquity = new Map();
  for (const trade of trades) {
    const key = dateKey(trade.executedAt);
    dailyEquity.set(key, round2((dailyEquity.get(key) || 0) + Number(trade.realizedPnL || 0)));
  }
  const days = Array.from(dailyEquity.keys()).sort();
  let peak = 0;
  let equity = 0;
  let drawdown = 0;
  for (const key of days) {
    equity += Number(dailyEquity.get(key) || 0);
    peak = Math.max(peak, equity);
    if (peak > 0) {
      drawdown = Math.max(drawdown, (peak - equity) / peak);
    }
  }
  const wins = trades.filter((trade) => Number(trade.realizedPnL || 0) > 0).length;
  const consistency = trades.length ? ((wins / trades.length) * 100 + (100 - drawdown * 100)) / 2 : 0;

  return {
    returnPct: round2(returnPct),
    riskAdjustedReturn: round2(returnPct / Math.max(drawdown * 100, 1)),
    consistency: round2(consistency),
  };
}

async function getLeaderboards(month) {
  const range = monthRange(month) || (() => {
    const now = new Date();
    return {
      start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
      end: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
    };
  })();

  const users = await User.find({}).select("_id username displayName startingCapital photoUrl").lean();
  const userIds = users.map((user) => user._id);
  const trades = await Trade.find({
    userId: { $in: userIds },
    executedAt: { $gte: range.start, $lt: range.end },
  })
    .sort({ executedAt: 1 })
    .lean();

  const grouped = new Map();
  for (const trade of trades) {
    const bucket = grouped.get(String(trade.userId)) || [];
    bucket.push(trade);
    grouped.set(String(trade.userId), bucket);
  }

  const boards = {
    highestReturn: [],
    highestRiskAdjustedReturn: [],
    bestConsistency: [],
  };

  for (const user of users) {
    const userTrades = grouped.get(String(user._id)) || [];
    if (!userTrades.length) continue;
    const metrics = leaderboardMetrics(userTrades, user.startingCapital);
    const base = {
      userId: String(user._id),
      username: user.displayName || user.username,
      photoUrl: user.photoUrl || "",
      tradesCount: userTrades.length,
      ...metrics,
    };
    boards.highestReturn.push(base);
    boards.highestRiskAdjustedReturn.push(base);
    boards.bestConsistency.push(base);
  }

  boards.highestReturn.sort((a, b) => b.returnPct - a.returnPct);
  boards.highestRiskAdjustedReturn.sort((a, b) => b.riskAdjustedReturn - a.riskAdjustedReturn);
  boards.bestConsistency.sort((a, b) => b.consistency - a.consistency);

  return {
    month,
    range,
    highestReturn: boards.highestReturn.slice(0, 10),
    highestRiskAdjustedReturn: boards.highestRiskAdjustedReturn.slice(0, 10),
    bestConsistency: boards.bestConsistency.slice(0, 10),
  };
}

async function getActiveChallenges(userId, date = new Date()) {
  await ensureTemplates();
  const dateKeyValue = dateKey(date);
  const challenges = await Challenge.find({ active: true }).sort({ sortOrder: 1 }).lean();
  const trades = await Trade.find({
    userId,
    executedAt: { $gte: startOfUtcDay(date), $lt: nextDay(date) },
  })
    .sort({ executedAt: 1 })
    .lean();
  const user = await User.findById(userId).select("startingCapital").lean();
  const dayPnL = round2(trades.reduce((sum, trade) => sum + Number(trade.realizedPnL || 0), 0));
  const dayReturnPct = user?.startingCapital ? round2((dayPnL / user.startingCapital) * 100) : 0;
  const maxPositionPct = trades.length
    ? round2(
        Math.max(...trades.map((trade) => (Number(trade.turnover || 0) / Math.max(user?.startingCapital || 1, 1)) * 100))
      )
    : 0;

  const existingProgress = await ChallengeProgress.find({ userId, dateKey: dateKeyValue }).lean();
  const progressMap = new Map(existingProgress.map((doc) => [String(doc.challengeId), doc]));
  const out = [];

  for (const challenge of challenges) {
    let progressValue = 0;
    if (challenge.challengeType === "RETURN") progressValue = dayReturnPct;
    if (challenge.challengeType === "TRADE_COUNT") progressValue = trades.length;
    if (challenge.challengeType === "RISK_LIMIT") progressValue = maxPositionPct;

    const completed =
      challenge.challengeType === "RISK_LIMIT"
        ? trades.length > 0 && progressValue <= challenge.targetValue
        : progressValue >= challenge.targetValue;
    const existing = progressMap.get(String(challenge._id));
    const progressDoc =
      existing ||
      (await ChallengeProgress.create({
        userId,
        challengeId: challenge._id,
        dateKey: dateKeyValue,
        targetValue: challenge.targetValue,
        progressValue,
        completed,
        completedAt: completed ? new Date() : null,
        rewardGranted: false,
        metadata: { dayPnL, dayReturnPct, tradeCount: trades.length, maxPositionPct },
      }));

    if (existing && !existing.completed && completed) {
      await ChallengeProgress.updateOne(
        { _id: existing._id },
        {
          $set: {
            progressValue,
            completed: true,
            completedAt: new Date(),
            metadata: { dayPnL, dayReturnPct, tradeCount: trades.length, maxPositionPct },
          },
        }
      );
    } else if (existing) {
      await ChallengeProgress.updateOne(
        { _id: existing._id },
        {
          $set: {
            progressValue,
            metadata: { dayPnL, dayReturnPct, tradeCount: trades.length, maxPositionPct },
          },
        }
      );
    }

    out.push({
      ...challenge,
      progress: progressValue,
      completed,
      rewardGranted: progressDoc.rewardGranted || false,
    });
  }

  return out;
}

async function evaluateChallenges(userId, date = new Date()) {
  const challenges = await getActiveChallenges(userId, date);
  const userState = await getEngagementState(userId);
  for (const challenge of challenges) {
    if (challenge.completed && !challenge.rewardGranted) {
      await ChallengeProgress.updateOne(
        { userId, challengeId: challenge._id, dateKey: dateKey(date) },
        { $set: { rewardGranted: true } }
      );
      userState.rewardPoints += Number(challenge.rewardPoints || 0);
      await userState.save();
      await createNotification(userId, {
        type: "CHALLENGE",
        title: `${challenge.title} complete`,
        message: challenge.description,
        metadata: { challengeId: String(challenge._id), rewardPoints: challenge.rewardPoints },
      });
    }
  }
  return getActiveChallenges(userId, date);
}

async function evaluateAchievements(userId) {
  await ensureTemplates();
  const user = await User.findById(userId).lean();
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  const tradeCount = await Trade.countDocuments({ userId });
  const unlocks = [];
  const achievements = await Achievement.find({ active: true }).sort({ sortOrder: 1 }).lean();
  const weekStart = new Date(Date.now() - 7 * 86400000);
  const weekTrades = await Trade.find({ userId, executedAt: { $gte: weekStart } }).lean();
  const weekPnl = weekTrades.reduce((sum, trade) => sum + Number(trade.realizedPnL || 0), 0);
  const portfolio = await Holding.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(String(userId)) } },
    { $group: { _id: null, value: { $sum: { $multiply: ["$quantity", "$lastPrice"] } } } },
  ]);
  const portfolioValue = round2((user.availableCash || 0) + (portfolio[0]?.value || 0));

  for (const achievement of achievements) {
    const existing = await UserAchievement.findOne({
      userId,
      achievementId: achievement._id,
    }).lean();
    if (existing) continue;

    let unlocked = false;
    if (achievement.criteriaType === "FIRST_TRADE" && tradeCount >= 1) unlocked = true;
    if (achievement.criteriaType === "TRADE_COUNT" && tradeCount >= achievement.targetValue) unlocked = true;
    if (achievement.criteriaType === "PROFITABLE_WEEK" && weekTrades.length >= 1 && weekPnl > 0) unlocked = true;
    if (achievement.criteriaType === "PORTFOLIO_DBL" && portfolioValue >= user.startingCapital * 2) unlocked = true;

    if (unlocked) {
      await UserAchievement.create({ userId, achievementId: achievement._id, metadata: { tradeCount, weekPnl, portfolioValue } });
      await createNotification(userId, {
        type: "ACHIEVEMENT",
        title: `${achievement.title} unlocked`,
        message: achievement.description,
        metadata: { achievementId: String(achievement._id), rewardPoints: achievement.rewardPoints },
      });
      unlocks.push({ ...achievement, unlockedAt: new Date() });
    }
  }

  return unlocks;
}

async function getAchievements(userId) {
  await ensureTemplates();
  const achievements = await Achievement.find({ active: true }).sort({ sortOrder: 1 }).lean();
  const unlocks = await UserAchievement.find({ userId }).lean();
  const unlockMap = new Map(unlocks.map((unlock) => [String(unlock.achievementId), unlock]));
  return achievements.map((achievement) => ({
    ...achievement,
    unlocked: Boolean(unlockMap.get(String(achievement._id))),
    unlockedAt: unlockMap.get(String(achievement._id))?.unlockedAt || null,
  }));
}

async function getNotifications(userId, limit = 30) {
  return Notification.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
}

async function markNotificationRead(userId, id) {
  const doc = await Notification.findOneAndUpdate(
    { _id: id, userId },
    { $set: { readAt: new Date() } },
    { new: true }
  ).lean();
  if (!doc) throw new AppError("Notification not found", 404, "NOTIFICATION_NOT_FOUND");
  return doc;
}

async function getEngagementSnapshot(userId) {
  const [state, riskScore, achievements, challenges, notifications] = await Promise.all([
    getEngagementState(userId),
    getRiskScore(userId),
    getAchievements(userId),
    getActiveChallenges(userId),
    getNotifications(userId, 10),
  ]);

  return {
    streaks: state,
    riskScore,
    achievements,
    challenges,
    notifications,
  };
}

module.exports = {
  ensureTemplates,
  getEngagementState,
  recordLoginEvent,
  recordLearningEvent,
  recordTradeEvent,
  getJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  getRiskScore,
  getRiskHistory,
  getLeaderboards,
  getActiveChallenges,
  evaluateChallenges,
  evaluateAchievements,
  getAchievements,
  getNotifications,
  markNotificationRead,
  getEngagementSnapshot,
};
