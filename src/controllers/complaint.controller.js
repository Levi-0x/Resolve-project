import { Complaint } from "../models/complaint.model.js";
import { User } from "../models/user.model.js";
import { createComplaintSchema, updateComplaintSchema, updateStatusSchema } from "../validators/complaint.validator.js";

// Any logged-in resident can file a complaint.
export async function createComplaint(req, res, next) {
  try {
    const { error, value } = createComplaintSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ detail: error.details[0].message });
    }

    const complaint = await Complaint.create({
      ...value,
      resident: req.user.id,
    });

    return res.status(201).json(complaint);
  } catch (err) {
    return next(err);
  }
}

// Role-aware: residents see only their own complaints, admins see everyone's.
// Supports ?status=Pending to filter, used by the "View All" links later.
export async function getComplaints(req, res, next) {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.user.role === "resident") filter.resident = req.user.id;

    const complaints = await Complaint.find(filter)
      .populate("resident", "fullName building unit")
      .sort({ createdAt: -1 });

    return res.status(200).json(complaints);
  } catch (err) {
    return next(err);
  }
}

export async function getComplaintById(req, res, next) {
  try {
    const complaint = await Complaint.findById(req.params.id).populate(
      "resident",
      "fullName building unit"
    );

    if (!complaint) {
      return res.status(404).json({ detail: "Complaint not found" });
    }

    // a resident may only view their own complaint, not someone else's
    // (the resident can be null if that account was deleted)
    if (req.user.role === "resident" && complaint.resident?._id.toString() !== req.user.id) {
      return res.status(403).json({ detail: "You cannot view this complaint" });
    }

    return res.status(200).json(complaint);
  } catch (err) {
    return next(err);
  }
}

// Admin changes a complaint's status via the dropdown in the admin table.
export async function updateComplaintStatus(req, res, next) {
  try {
    const { error, value } = updateStatusSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ detail: error.details[0].message });
    }

    // resolvedAt feeds Avg. Res Time, so clear it if a complaint is re-opened
    const update = {
      status: value.status,
      resolvedAt: value.status === "Resolved" ? new Date() : null,
    };

    const complaint = await Complaint.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!complaint) {
      return res.status(404).json({ detail: "Complaint not found" });
    }

    return res.status(200).json(complaint);
  } catch (err) {
    return next(err);
  }
}

// A resident edits one of their own complaints, but only while it is still Pending.
export async function updateComplaint(req, res, next) {
  try {
    const { error, value } = updateComplaintSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ detail: error.details[0].message });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ detail: "Complaint not found" });
    }
    if (complaint.resident.toString() !== req.user.id) {
      return res.status(403).json({ detail: "You can only edit your own complaints" });
    }
    if (complaint.status !== "Pending") {
      return res.status(409).json({ detail: "Only pending complaints can be edited" });
    }

    Object.assign(complaint, value);
    await complaint.save();

    return res.status(200).json(complaint);
  } catch (err) {
    return next(err);
  }
}

// Admins can delete any complaint. A resident can withdraw their own, while it is Pending.
export async function deleteComplaint(req, res, next) {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ detail: "Complaint not found" });
    }

    if (req.user.role === "resident") {
      if (complaint.resident.toString() !== req.user.id) {
        return res.status(403).json({ detail: "You can only delete your own complaints" });
      }
      if (complaint.status !== "Pending") {
        return res.status(409).json({ detail: "Only pending complaints can be withdrawn" });
      }
    }

    await complaint.deleteOne();
    return res.status(200).json({ message: "Complaint deleted" });
  } catch (err) {
    return next(err);
  }
}

// Feeds the 4 stat cards on admin-dashboard.html: Total Users, Total
// Complaints, Resolved, Pending.
export async function getAdminStats(req, res, next) {
  try {
    const [totalUsers, totalComplaints, resolved, pending] = await Promise.all([
      User.countDocuments({ role: "resident" }),
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: "Resolved" }),
      Complaint.countDocuments({ status: "Pending" }),
    ]);

    return res.status(200).json({ totalUsers, totalComplaints, resolved, pending });
  } catch (err) {
    return next(err);
  }
}

// Feeds the 4 stat cards on user-dashboard.html: Total Complaints, Pending,
// Resolved, Avg. Res Time (in hours, rounded to 1 decimal place).
export async function getMyStats(req, res, next) {
  try {
    const residentId = req.user.id;

    const [totalComplaints, pending, resolvedComplaints] = await Promise.all([
      Complaint.countDocuments({ resident: residentId }),
      Complaint.countDocuments({ resident: residentId, status: "Pending" }),
      Complaint.find({ resident: residentId, status: "Resolved", resolvedAt: { $ne: null } }),
    ]);

    let avgResTimeHours = 0;
    if (resolvedComplaints.length > 0) {
      const totalHours = resolvedComplaints.reduce((sum, c) => {
        const hours = (c.resolvedAt - c.createdAt) / (1000 * 60 * 60);
        return sum + hours;
      }, 0);
      avgResTimeHours = Math.round((totalHours / resolvedComplaints.length) * 10) / 10;
    }

    return res.status(200).json({
      totalComplaints,
      pending,
      resolved: resolvedComplaints.length,
      avgResTimeHours,
    });
  } catch (err) {
    return next(err);
  }
}
