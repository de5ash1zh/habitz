import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import authRouter from "./routes/auth.js";
import habitsRouter from "./routes/habits.js";
import checkinsRouter from "./routes/checkins.js";
import socialRouter from "./routes/social.js";
import usersRouter from "./routes/users.js";
import { csrfMiddleware } from "./middleware/csrf.js";

dotenv.config();

const app = express();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const CORS_ORIGINS = (process.env.CORS_ORIGINS || FRONTEND_URL)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 3000;

// Flexible CORS: supports comma-separated CORS_ORIGINS and wildcard subdomains like https://*.vercel.app
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // non-browser or same-origin
      const ok = CORS_ORIGINS.some((allowed) => {
        if (allowed === "*") return true;
        if (allowed.startsWith("https://*.") || allowed.startsWith("http://*.")) {
          const isHttps = allowed.startsWith("https://");
          const suffix = allowed.replace(/^https?:\/\*\./, "");
          const schemeOk = isHttps ? origin.startsWith("https://") : origin.startsWith("http://");
          return schemeOk && origin.endsWith(suffix);
        }
        return origin === allowed;
      });
      return callback(ok ? null : new Error("Not allowed by CORS"), ok);
    },
    credentials: true,
  })
);
app.use(express.json());

// CSRF protection (double-submit cookie) for non-GET endpoints
app.use(csrfMiddleware);

// Routes
app.use("/api/auth", authRouter);
app.use("/api/habits", habitsRouter);
app.use("/api/checkins", checkinsRouter);
app.use("/api", socialRouter); // provides /follow, /friends, /feed
app.use("/api/users", usersRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server only after MongoDB connection succeeds
async function start() {
  try {
    await connectDB(MONGODB_URI);
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`CORS origins: ${CORS_ORIGINS.join(", ")}`);
    });
  } catch (err) {
    console.error("Failed to start server due to DB connection error.");
    process.exit(1);
  }
}

start();
