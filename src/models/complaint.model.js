import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true }, // shown as "ISSUE" in the tables
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["Plumbing", "Electrical", "Furniture", "Maintenance", "Other"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"],
      default: "Pending",
    },
    resident: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    resolvedAt: { type: Date, default: null }, // set when status flips to "Resolved" — used for Avg. Res Time
  },
  { timestamps: true } // createdAt feeds the "CREATED" column
);

export const Complaint = mongoose.model("Complaint", complaintSchema);
