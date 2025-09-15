import express from "express";
import { authRequired } from "../middleware/auth.js";
import { CheckIn } from "../models/CheckIn.js";
import { Habit } from "../models/Habit.js";
import { isValidObjectId, normalizeDateUTC, parseISODate } from "../utils/validators.js";

const router = express.Router();

router.use(authRequired);

// POST /api/checkins - create or update a check-in
// Body: { habitId, date (ISO string or YYYY-MM-DD), completed (bool=true) }
router.post("/", async (req, res) => {
  try {
    const { habitId, date, completed = true } = req.body || {};
    if (!habitId) return res.status(400).json({ message: "habitId is required" });
    if (!isValidObjectId(habitId)) return res.status(400).json({ message: "Invalid habitId" });

    // ensure habit belongs to user
    const habit = await Habit.findOne({ _id: habitId, userId: req.user.id });
    if (!habit) return res.status(404).json({ message: "Habit not found" });

    const d = date ? parseISODate(date) : new Date();
    if (!d) return res.status(400).json({ message: "Invalid date format" });
    // normalize depending on habit frequency
    let normalized;
    if (habit.frequency === "weekly") {
      // Sunday week start
      const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
      const day = tmp.getUTCDay(); // 0 = Sunday
      tmp.setUTCDate(tmp.getUTCDate() - day);
      normalized = tmp;
    } else {
      // daily/custom -> per day uniqueness
      normalized = normalizeDateUTC(d);
    }

    const checkIn = await CheckIn.findOneAndUpdate(
      { userId: req.user.id, habitId, date: normalized },
      { $set: { completed: Boolean(completed) } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ checkIn });
  } catch (err) {
    console.error("Create check-in error:", err);
    res.status(500).json({ message: "Failed to create check-in" });
  }
});

// GET /api/checkins/:habitId?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/:habitId", async (req, res) => {
  const { habitId } = req.params;
  const { from, to } = req.query;
  if (!isValidObjectId(habitId)) return res.status(400).json({ message: "Invalid habit id" });

  // ensure habit belongs to user
  const habit = await Habit.findOne({ _id: habitId, userId: req.user.id });
  if (!habit) return res.status(404).json({ message: "Habit not found" });

  const filter = { userId: req.user.id, habitId };
  if (from || to) {
    const fromDate = from ? parseISODate(from) : null;
    const toDate = to ? parseISODate(to) : null;
    if ((from && !fromDate) || (to && !toDate)) {
      return res.status(400).json({ message: "Invalid from/to date format" });
    }
    filter.date = {};
    if (fromDate) filter.date.$gte = fromDate;
    if (toDate) filter.date.$lte = toDate;
    if (fromDate && toDate && fromDate > toDate) {
      return res.status(400).json({ message: "from date cannot be after to date" });
    }
  }
  const checkIns = await CheckIn.find(filter).sort({ date: 1 });
  res.json({ checkIns });
});

export default router;
