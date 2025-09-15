import express from "express";
import { authRequired } from "../middleware/auth.js";
import { Habit } from "../models/Habit.js";
import { isValidObjectId } from "../utils/validators.js";
import { getDailyStreak, getWeeklyStreak, getCompletionRate } from "../utils/streakCalculator.js";

const router = express.Router();

// All routes here require auth
router.use(authRequired);

// GET /api/habits - list current user's habits
router.get("/", async (req, res) => {
  const { category, tags, q } = req.query || {};
  const filter = { userId: req.user.id };
  if (category) filter.category = category;
  if (tags) {
    const arr = String(tags)
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    if (arr.length) filter.tags = { $in: arr };
  }
  if (q) {
    filter.name = { $regex: String(q).trim(), $options: "i" };
  }
  const habits = await Habit.find(filter).sort({ createdAt: -1 });
  res.json({ habits });
});

// GET /api/habits/:id - fetch single habit
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid habit id" });
  const habit = await Habit.findOne({ _id: id, userId: req.user.id });
  if (!habit) return res.status(404).json({ message: "Habit not found" });
  res.json({ habit });
});

// POST /api/habits - create a habit
router.post("/", async (req, res) => {
  try {
    const { name, category, frequency = "daily", tags } = req.body || {};
    if (!name) return res.status(400).json({ message: "name is required" });
    if (!["daily", "weekly", "custom"].includes(frequency)) {
      return res.status(400).json({ message: "frequency must be one of daily, weekly, custom" });
    }

    const habit = await Habit.create({ userId: req.user.id, name, category, frequency, tags });
    res.status(201).json({ habit });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "You already have a habit with this name" });
    }
    if (err?.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    console.error("Create habit error:", err);
    res.status(500).json({ message: "Failed to create habit" });
  }
});

// PUT /api/habits/:id - update a habit (name/category/frequency)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, category, frequency, tags } = req.body || {};

  if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid habit id" });
  const update = {};
  if (typeof name === "string") update.name = name;
  if (typeof category === "string") update.category = category;
  if (typeof tags !== "undefined") {
    const arr = Array.isArray(tags)
      ? tags
      : String(tags || "")
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean);
    update.tags = arr.slice(0, 10);
  }
  if (typeof frequency !== "undefined") {
    if (!["daily", "weekly", "custom"].includes(frequency)) {
      return res.status(400).json({ message: "frequency must be one of daily, weekly, custom" });
    }
    update.frequency = frequency;
  }
  if (!Object.keys(update).length) {
    return res.status(400).json({ message: "No valid fields to update" });
  }

  try {
    const habit = await Habit.findOneAndUpdate({ _id: id, userId: req.user.id }, { $set: update }, { new: true, runValidators: true });
    if (!habit) return res.status(404).json({ message: "Habit not found" });
    res.json({ habit });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "You already have a habit with this name" });
    }
    if (err?.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    console.error("Update habit error:", err);
    res.status(500).json({ message: "Failed to update habit" });
  }
});

// DELETE /api/habits/:id - delete habit
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid habit id" });
  const deleted = await Habit.findOneAndDelete({ _id: id, userId: req.user.id });
  if (!deleted) return res.status(404).json({ message: "Habit not found" });
  res.json({ message: "Habit deleted" });
});

export default router;

// Streak endpoints
router.get("/:id/streaks", async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid habit id" });
  const habit = await Habit.findOne({ _id: id, userId: req.user.id });
  if (!habit) return res.status(404).json({ message: "Habit not found" });
  const [daily, weekly, completion] = await Promise.all([
    getDailyStreak({ userId: req.user.id, habitId: id }),
    getWeeklyStreak({ userId: req.user.id, habitId: id }),
    getCompletionRate({ userId: req.user.id, habitId: id, days: 7 }),
  ]);
  return res.json({ daily, weekly, completion });
});

router.post("/:id/validate-streaks", async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid habit id" });
  const habit = await Habit.findOne({ _id: id, userId: req.user.id });
  if (!habit) return res.status(404).json({ message: "Habit not found" });
  const server = await getDailyStreak({ userId: req.user.id, habitId: id });
  // For demo, echo server values. In real validation, compare with client-provided payload
  return res.json({ ok: true, server });
});
