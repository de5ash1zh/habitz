import express from "express";
import { authRequired } from "../middleware/auth.js";
import { User } from "../models/User.js";

const router = express.Router();

router.use(authRequired);

// GET /api/users/search?q=term&limit=20
router.get("/search", async (req, res) => {
  try {
    const q = (req.query.q || "").toString().trim();
    let limit = parseInt(req.query.limit || "20", 10);
    if (isNaN(limit) || limit <= 0) limit = 20;
    limit = Math.min(limit, 50);

    if (!q) return res.json({ users: [] });
    if (q.length < 2) return res.status(400).json({ message: "Query must be at least 2 characters" });
    if (q.length > 50) return res.status(400).json({ message: "Query must be at most 50 characters" });

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    const users = await User.find({
      _id: { $ne: req.user.id },
      $or: [{ username: regex }, { email: regex }],
    })
      .select("username email createdAt")
      .limit(limit)
      .lean();

    res.json({
      users: users.map((u) => ({ id: u._id, username: u.username, email: u.email, createdAt: u.createdAt })),
    });
  } catch (err) {
    console.error("User search error:", err);
    res.status(500).json({ message: "Failed to search users" });
  }
});

export default router;
