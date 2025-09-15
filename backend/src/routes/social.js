import express from "express";
import { authRequired } from "../middleware/auth.js";
import { Follow } from "../models/Follow.js";
import { User } from "../models/User.js";
import { CheckIn } from "../models/CheckIn.js";
import { Habit } from "../models/Habit.js";
import { isValidObjectId } from "../utils/validators.js";
import { getDailyStreak, getCompletionRate } from "../utils/streakCalculator.js";

const router = express.Router();

router.use(authRequired);

// POST /api/follow { userId } -> follow another user
router.post("/follow", async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ message: "userId is required" });
    if (!isValidObjectId(userId)) return res.status(400).json({ message: "Invalid userId" });
    if (userId === req.user.id) return res.status(400).json({ message: "Cannot follow yourself" });

    const target = await User.findById(userId).select("_id username");
    if (!target) return res.status(404).json({ message: "User not found" });

    const follow = await Follow.findOneAndUpdate(
      { followerId: req.user.id, followingId: userId },
      {},
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );

    return res.status(201).json({ follow });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(200).json({ message: "Already following" });
    }
    if (err?.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    console.error("Follow error:", err);
    res.status(500).json({ message: "Failed to follow" });
  }
});

// DELETE /api/unfollow/:userId -> unfollow a user
router.delete("/unfollow/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) return res.status(400).json({ message: "Invalid userId" });
    if (userId === req.user.id) return res.status(400).json({ message: "Cannot unfollow yourself" });

    const result = await Follow.findOneAndDelete({ followerId: req.user.id, followingId: userId });
    if (!result) return res.status(404).json({ message: "Not following this user" });
    return res.json({ message: "Unfollowed" });
  } catch (err) {
    console.error("Unfollow error:", err);
    res.status(500).json({ message: "Failed to unfollow" });
  }
});

// GET /api/friends -> list users you follow
router.get("/friends", async (req, res) => {
  try {
    const follows = await Follow.find({ followerId: req.user.id }).select("followingId");
    const ids = follows.map((f) => f.followingId);
    if (!ids.length) return res.json({ friends: [] });
    const friends = await User.find({ _id: { $in: ids } }).select("username email createdAt");
    res.json({ friends: friends.map((u) => ({ id: u._id, username: u.username, email: u.email, createdAt: u.createdAt })) });
  } catch (err) {
    console.error("Friends error:", err);
    res.status(500).json({ message: "Failed to fetch friends" });
  }
});

// GET /api/feed?limit=50 -> recent check-ins from people you follow
router.get("/feed", async (req, res) => {
  try {
    let limit = parseInt(req.query.limit || "50", 10);
    if (isNaN(limit) || limit <= 0) limit = 50;
    limit = Math.min(limit, 100);

    const follows = await Follow.find({ followerId: req.user.id }).select("followingId");
    const ids = follows.map((f) => f.followingId);
    if (!ids.length) return res.json({ items: [] });

    const checkIns = await CheckIn.find({ userId: { $in: ids } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // attach user and habit info
    const userMap = Object.fromEntries(
      (await User.find({ _id: { $in: [...new Set(checkIns.map((c) => c.userId.toString()))] } }).select("username")).map((u) => [u._id.toString(), u])
    );
    const habitMap = Object.fromEntries(
      (await Habit.find({ _id: { $in: [...new Set(checkIns.map((c) => c.habitId.toString()))] } })
        .select("name"))
        .map((h) => [h._id.toString(), h])
    );

    const items = checkIns.map((c) => ({
      id: c._id,
      user: { id: c.userId, username: userMap[c.userId.toString()]?.username },
      habit: { id: c.habitId, name: habitMap[c.habitId.toString()]?.name },
      date: c.date,
      completed: c.completed,
      createdAt: c.createdAt,
    }));

    res.json({ items });
  } catch (err) {
    console.error("Feed error:", err);
    res.status(500).json({ message: "Failed to fetch feed" });
  }
});

export default router;

// GET /api/leaderboard?metric=current|longest|completion&limit=50
router.get("/leaderboard", async (req, res) => {
  try {
    let { metric = "current", limit = 50 } = req.query || {};
    limit = Math.min(parseInt(limit, 10) || 50, 100);
    if (!["current", "longest", "completion"].includes(metric)) metric = "current";

    // Fetch all users (basic fields)
    const users = await User.find({}).select("username").lean();
    if (!users.length) return res.json({ items: [] });

    // For each user, compute max current and longest streak among their habits
    const results = [];
    for (const u of users) {
      const habits = await Habit.find({ userId: u._id }).select("_id").lean();
      if (!habits.length) {
        results.push({ user: { id: u._id, username: u.username }, current: 0, longest: 0, completionRate: 0 });
        continue;
      }
      let maxCurrent = 0;
      let maxLongest = 0;
      let completionSum = 0;
      for (const h of habits) {
        const d = await getDailyStreak({ userId: u._id, habitId: h._id });
        maxCurrent = Math.max(maxCurrent, d.currentStreak || 0);
        maxLongest = Math.max(maxLongest, d.longestStreak || 0);
        const c = await getCompletionRate({ userId: u._id, habitId: h._id, days: 7 });
        completionSum += c.completionRate || 0;
      }
      const completionRate = Math.round(completionSum / habits.length);
      results.push({ user: { id: u._id, username: u.username }, current: maxCurrent, longest: maxLongest, completionRate });
    }

    const sorted = results.sort((a, b) => {
      if (metric === "current") return (b.current || 0) - (a.current || 0);
      if (metric === "longest") return (b.longest || 0) - (a.longest || 0);
      return (b.completionRate || 0) - (a.completionRate || 0);
    });

    res.json({ items: sorted.slice(0, limit), metric });
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ message: "Failed to compute leaderboard" });
  }
});
