import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Complaint } from "../models/complaint.model.js";
import { signupSchema, signinSchema, updateProfileSchema } from "../validators/user.validator.js";
import { generateAccessToken, generateRefreshToken } from "../services/token.services.js";
import { env } from "../config/env.js";

export async function signup(req, res, next) {
  try {
    const { error, value } = signupSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ detail: error.details[0].message });
    }

    const existing = await User.findOne({ email: value.email });
    if (existing) {
      return res.status(409).json({ detail: "An account with that email already exists" });
    }

    const hashedPassword = await bcrypt.hash(value.password, 10);

    const user = await User.create({
      fullName: value.fullName,
      building: value.building,
      unit: value.unit,
      email: value.email,
      password: hashedPassword,
      // role is never taken from the client — everyone who signs up is a resident
    });

    return res.status(201).json({
      message: "Account created successfully",
      user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
    });
  } catch (err) {
    return next(err);
  }
}

export async function signin(req, res, next) {
  try {
    const { error, value } = signinSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ detail: error.details[0].message });
    }

    // "@" means email; anything else is treated as the full name (case-insensitive)
    const candidates = value.identifier.includes("@")
      ? await User.find({ email: value.identifier.toLowerCase() })
      : await User.find({ fullName: value.identifier }).collation({ locale: "en", strength: 2 });

    // full names aren't unique, so keep only the accounts whose password matches
    const matches = [];
    for (const candidate of candidates) {
      if (await bcrypt.compare(value.password, candidate.password)) matches.push(candidate);
    }

    if (matches.length === 0) {
      return res.status(401).json({ detail: "Invalid name/email or password" });
    }
    if (matches.length > 1) {
      return res
        .status(409)
        .json({ detail: "More than one account matches that name. Sign in with your email instead." });
    }

    const user = matches[0];
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return res.status(200).json({
      accessToken,
      refreshToken,
      user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
    });
  } catch (err) {
    return next(err);
  }
}

export async function refreshAccessToken(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ detail: "Refresh token required" });
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ detail: "Invalid or expired refresh token" });
    }

    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(401).json({ detail: "User no longer exists" });
    }

    const accessToken = generateAccessToken(user);
    return res.status(200).json({ accessToken });
  } catch (err) {
    return next(err);
  }
}

export async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ detail: "User not found" });
    }
    return res.status(200).json(user);
  } catch (err) {
    return next(err);
  }
}

// Admin: list every resident, with how many complaints each has filed.
export async function getUsers(req, res, next) {
  try {
    const users = await User.aggregate([
      { $match: { role: "resident" } },
      {
        $lookup: {
          from: "complaints",
          localField: "_id",
          foreignField: "resident",
          as: "complaints",
        },
      },
      { $addFields: { complaintCount: { $size: "$complaints" } } },
      { $project: { password: 0, complaints: 0 } },
    ]);

    return res.status(200).json(users);
  } catch (err) {
    return next(err);
  }
}

// Any logged-in user updates their own details (profile page).
export async function updateProfile(req, res, next) {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ detail: error.details[0].message });
    }

    if (value.email) {
      const taken = await User.findOne({ email: value.email, _id: { $ne: req.user.id } });
      if (taken) {
        return res.status(409).json({ detail: "An account with that email already exists" });
      }
    }

    const user = await User.findByIdAndUpdate(req.user.id, value, {
      new: true,
      runValidators: true,
    }).select("-password");
    if (!user) {
      return res.status(404).json({ detail: "User not found" });
    }

    return res.status(200).json(user);
  } catch (err) {
    return next(err);
  }
}

// Admin deletes a resident. Their complaints go with them.
export async function deleteUser(req, res, next) {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ detail: "You can't delete your own account" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ detail: "User not found" });
    }
    if (user.role === "admin") {
      return res.status(403).json({ detail: "Admin accounts can't be deleted" });
    }

    await Complaint.deleteMany({ resident: user._id });
    await user.deleteOne();

    return res.status(200).json({ message: "User and their complaints deleted" });
  } catch (err) {
    return next(err);
  }
}
