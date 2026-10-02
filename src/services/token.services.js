import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// payload stays small on purpose — just enough for the authenticate
// middleware to identify who's making the request and what they're allowed to do.
export function generateAccessToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.ACCESS_TOKEN_EXPIRY }
  );
}

export function generateRefreshToken(user) {
  return jwt.sign(
    { id: user._id },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.REFRESH_TOKEN_EXPIRY }
  );
}
