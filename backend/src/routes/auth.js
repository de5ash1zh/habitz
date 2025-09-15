import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

function signToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET env variable");
  }
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

function cookieOptions(maxAgeMs) {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: maxAgeMs ?? 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, rememberMe } = req.body || {};

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "username, email, and password are required" });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res
        .status(409)
        .json({ message: "User with this email or username already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = await User.create({ username, email, password: hash });

    const token = signToken({ id: user._id.toString() });

    const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : undefined; // 30 days if remember
    res.cookie("token", token, cookieOptions(maxAge));

    return res.status(201).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Registration failed" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body || {};

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken({ id: user._id.toString() });

    res.cookie("token", token, cookieOptions());

    return res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Login failed" });
  }
});

// Optional: GET /api/auth/me (protected) to verify middleware
router.get("/me", authRequired, async (req, res) => {
  const user = await User.findById(req.user.id).select(
    "username email createdAt"
  );
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
});

// Optional: POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie("token", { path: "/" });
  return res.json({ message: "Logged out" });
});

// GET /api/auth/availability?username=&email=  -> check if taken
router.get("/availability", async (req, res) => {
  const { username, email } = req.query;
  if (!username && !email) return res.status(400).json({ message: "username or email required" });
  const or = [];
  if (username) or.push({ username });
  if (email) or.push({ email });
  const existing = await User.findOne({ $or: or }).select("username email");
  return res.json({ available: !existing });
});

// POST /api/auth/refresh -> issue a new token/cookie if current is valid
router.post("/refresh", authRequired, async (req, res) => {
  try {
    const token = signToken({ id: req.user.id });
    res.cookie("token", token, cookieOptions());
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ message: "Failed to refresh" });
  }
});

export default router;
