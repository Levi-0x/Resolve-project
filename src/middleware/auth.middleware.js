import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ detail: "Not authenticated" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.user = payload; // { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ detail: "Invalid or expired token" });
  }
}

// Must run AFTER authenticate — relies on req.user already being set.
export function adminsOnly(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ detail: "Admins only" });
  }
  next();
}

export function usersOnly(req, res, next) {
  if (req.user.role !== "resident") {
    return res.status(403).json({ detail: "Residents only" });
  }
  next();
}
