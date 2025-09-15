// Simple double-submit cookie CSRF protection
// - Sets a readable (non-httpOnly) csrfToken cookie if missing
// - Requires matching X-CSRF-Token header on state-changing requests

import crypto from "crypto";

const CSRF_COOKIE = "csrfToken";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function parseCookies(header) {
  const list = {};
  if (!header) return list;
  header.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    const key = decodeURIComponent(parts[0].trim());
    const value = decodeURIComponent(parts.slice(1).join("=").trim());
    if (key) list[key] = value;
  });
  return list;
}

export function csrfMiddleware(req, res, next) {
  try {
    const cookies = parseCookies(req.headers["cookie"]);
    let token = cookies[CSRF_COOKIE];

    // Set token if missing
    if (!token) {
      token = crypto.randomBytes(16).toString("hex");
      res.cookie(CSRF_COOKIE, token, {
        httpOnly: false, // must be readable by JS to set request header
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    if (!SAFE_METHODS.has(req.method)) {
      const headerToken = req.headers["x-csrf-token"]; // case-insensitive access normalized
      if (!headerToken || headerToken !== token) {
        return res.status(403).json({ message: "CSRF token invalid or missing" });
      }
    }

    next();
  } catch (err) {
    console.error("CSRF middleware error:", err);
    return res.status(500).json({ message: "CSRF validation failed" });
  }
}
