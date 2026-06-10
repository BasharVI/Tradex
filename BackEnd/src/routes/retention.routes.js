const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const requireAuth = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  tradeJournalSchema,
  journalUpdateSchema,
  periodSchema,
} = require("../validators/retention.schema");
const {
  getEngagementSnapshot,
  getJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  getRiskScore,
  getRiskHistory,
  getLeaderboards,
  getActiveChallenges,
  recordLearningEvent,
  getAchievements,
  getNotifications,
  markNotificationRead,
} = require("../services/retention.service");

const router = express.Router();
router.use(requireAuth);

router.get(
  "/snapshot",
  asyncHandler(async (req, res) => {
    res.json({ snapshot: await getEngagementSnapshot(req.userId) });
  })
);

router.get(
  "/journals",
  asyncHandler(async (req, res) => {
    res.json({ journals: await getJournalEntries(req.userId) });
  })
);

router.post(
  "/journals",
  validate(tradeJournalSchema),
  asyncHandler(async (req, res) => {
    const journal = await createJournalEntry(req.userId, req.body);
    res.status(201).json({ journal });
  })
);

router.patch(
  "/journals/:id",
  validate(journalUpdateSchema),
  asyncHandler(async (req, res) => {
    const journal = await updateJournalEntry(req.userId, req.params.id, req.body);
    res.json({ journal });
  })
);

router.delete(
  "/journals/:id",
  asyncHandler(async (req, res) => {
    res.json(await deleteJournalEntry(req.userId, req.params.id));
  })
);

router.get(
  "/risk-score",
  validate(periodSchema, "query"),
  asyncHandler(async (req, res) => {
    const score = await getRiskScore(req.userId, req.query);
    res.json({ score });
  })
);

router.get(
  "/risk-score/history",
  asyncHandler(async (req, res) => {
    res.json({ history: await getRiskHistory(req.userId) });
  })
);

router.get(
  "/leaderboards",
  asyncHandler(async (req, res) => {
    res.json({ leaderboards: await getLeaderboards(req.query.month) });
  })
);

router.get(
  "/challenges",
  asyncHandler(async (req, res) => {
    res.json({ challenges: await getActiveChallenges(req.userId) });
  })
);

router.get(
  "/achievements",
  asyncHandler(async (req, res) => {
    res.json({ achievements: await getAchievements(req.userId) });
  })
);

router.get(
  "/notifications",
  asyncHandler(async (req, res) => {
    res.json({ notifications: await getNotifications(req.userId) });
  })
);

router.patch(
  "/notifications/:id/read",
  asyncHandler(async (req, res) => {
    res.json({ notification: await markNotificationRead(req.userId, req.params.id) });
  })
);

router.post(
  "/learning/checkin",
  asyncHandler(async (req, res) => {
    const state = await recordLearningEvent(req.userId);
    res.json({ state });
  })
);

router.get(
  "/learning/stats",
  asyncHandler(async (req, res) => {
    const snapshot = await getEngagementSnapshot(req.userId);
    res.json({ learning: snapshot.streaks.learning });
  })
);

module.exports = router;
