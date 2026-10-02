import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    building: { type: String, required: true, trim: true }, // "Building / Hall" on signup
    unit: { type: String, required: true, trim: true },      // "Unit / Room #" on signup
    phone: { type: String, trim: true, default: "" }, // optional, set from the profile page
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // stored as a bcrypt hash, never plain text
    role: { type: String, enum: ["resident", "admin"], default: "resident" },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
