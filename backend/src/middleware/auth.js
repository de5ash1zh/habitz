import jwt from "jsonwebtoken";

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

export function authRequired(req, res, next) {
  try {
    const authHeader = req.headers["authorization"]; 
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    if (!token) {
      const cookies = parseCookies(req.headers["cookie"]);
      token = cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("Missing JWT_SECRET env variable");
      return res.status(500).json({ message: "Server misconfiguration" });
    }

    const payload = jwt.verify(token, secret);
    req.user = { id: payload.id };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
